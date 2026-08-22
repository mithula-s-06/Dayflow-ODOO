'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface PayslipResult {
  success: boolean
  message: string
  count?: number
}

/**
 * Generates monthly payslips for all company employees (Admin/HR only)
 */
export async function generatePayslips(month: number, year: number): Promise<PayslipResult> {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    // 1. Verify Admin user
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, message: 'Unauthorized.' }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'Admin') {
      return { success: false, message: 'Only Admins/HR Officers can run payroll.' }
    }

    const companyId = currentProfile.company_id

    // Start and end of month
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]

    // Fetch all profiles in company
    const { data: employees, error: empError } = await adminSupabase
      .from('profiles')
      .select('id, name, email')
      .eq('company_id', companyId)

    if (empError || !employees) {
      return { success: false, message: 'Failed to retrieve company employees.' }
    }

    // Compute standard working days in the month (excluding weekends)
    let totalWorkingDays = 0
    const totalDaysInMonth = new Date(year, month, 0).getDate()
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayOfWeek = new Date(year, month - 1, day).getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingDays++
      }
    }

    let generatedCount = 0

    // Loop through all employees and compute payslips
    for (const emp of employees) {
      // 2. Fetch salary configuration
      const { data: salConfig } = await adminSupabase
        .from('salary_configs')
        .select('*')
        .eq('profile_id', emp.id)
        .maybeSingle()

      // Skip employees without a monthly wage set
      if (!salConfig || salConfig.monthly_wage <= 0) {
        continue;
      }

      // 3. Fetch attendance logs for the month
      const { data: attendanceLogs } = await adminSupabase
        .from('attendance')
        .select('status')
        .eq('profile_id', emp.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      // Count absences and unpaid leaves
      // An absence is either a log with status='Absent' or a missing weekday without approved leave
      // Let's count present records:
      const presentLogs = attendanceLogs?.filter(l => l.status === 'Present').length || 0
      const halfDayLogs = attendanceLogs?.filter(l => l.status === 'Half-day').length || 0
      const leaveLogs = attendanceLogs?.filter(l => l.status === 'Leave').length || 0 // paid/sick leaves count as payable

      // For unpaid leaves:
      const { data: unpaidRequests } = await adminSupabase
        .from('time_off_requests')
        .select('start_date, end_date, num_days')
        .eq('profile_id', emp.id)
        .eq('status', 'Approved')
        .eq('leave_type', 'Unpaid Leaves')
        .or(`and(start_date.lte.${endOfMonth},end_date.gte.${startOfMonth})`)

      let unpaidDays = 0
      if (unpaidRequests) {
        const mStart = new Date(year, month - 1, 1)
        const mEnd = new Date(year, month, 0)
        unpaidRequests.forEach(req => {
          const start = new Date(req.start_date)
          const end = new Date(req.end_date)
          const clampStart = start < mStart ? mStart : start
          const clampEnd = end > mEnd ? mEnd : end
          const diff = Math.floor((clampEnd.getTime() - clampStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
          unpaidDays += diff
        })
      }

      // Count days worked = present + halfDay/2
      const daysWorked = presentLogs + (halfDayLogs * 0.5)
      
      // Payable days count
      // We assume standard payable = total working days minus unpaid leaves and unexcused absences
      // Unexcused Absences = total working days - days worked - leaveLogs (which are approved paid/sick leaves)
      const unexcusedAbsences = Math.max(0, totalWorkingDays - daysWorked - leaveLogs - unpaidDays)
      const payableDays = Math.max(0, totalWorkingDays - unpaidDays - unexcusedAbsences)

      // 4. Calculate Prorated Salary
      const baseWage = salConfig.monthly_wage
      const prorationRatio = payableDays / totalWorkingDays
      const proratedWage = Math.round((baseWage * prorationRatio) * 100) / 100

      // Calculate component breakdown
      const basic = Math.round((proratedWage * (salConfig.basic_salary_pct / 100)) * 100) / 100
      const hra = Math.round((basic * (salConfig.hra_pct / 100)) * 100) / 100
      const standardAllowance = Math.round((salConfig.standard_allowance * prorationRatio) * 100) / 100
      const performanceBonus = Math.round((basic * (salConfig.performance_bonus_pct / 100)) * 100) / 100
      const lta = Math.round((basic * (salConfig.lta_pct / 100)) * 100) / 100
      
      // Remainder special allowance
      const fixedAllowance = Math.max(
        0,
        Math.round((proratedWage - (basic + hra + standardAllowance + performanceBonus + lta)) * 100) / 100
      )

      // Deductions
      const employeePf = Math.round((basic * (salConfig.pf_rate / 100)) * 100) / 100
      const professionalTax = payableDays > 0 ? salConfig.professional_tax : 0.00
      const unpaidLeaveDeductions = Math.round((baseWage - proratedWage) * 100) / 100

      const grossSalary = proratedWage
      const totalDeductions = employeePf + professionalTax
      const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100)

      // 5. Upsert Payslip
      const { error: upsertError } = await adminSupabase
        .from('payslips')
        .upsert({
          profile_id: emp.id,
          month,
          year,
          monthly_wage: baseWage,
          basic,
          hra,
          standard_allowance: standardAllowance,
          performance_bonus: performanceBonus,
          lta,
          fixed_allowance: fixedAllowance,
          employee_pf: employeePf,
          professional_tax: professionalTax,
          unpaid_leave_deductions: unpaidLeaveDeductions,
          gross_salary: grossSalary,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          payable_days: payableDays
        }, { onConflict: 'profile_id, month, year' })

      if (!upsertError) {
        generatedCount++
      } else {
        console.error(`Error saving payslip for ${emp.name}:`, upsertError)
      }
    }

    revalidatePath('/dashboard/payroll')
    return {
      success: true,
      message: `Successfully calculated and generated ${generatedCount} employee payslips!`,
      count: generatedCount
    }
  } catch (error: any) {
    console.error('generatePayslips catch:', error)
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}

/**
 * Fetch company-wide generated payslips for a given month/year (Admin/HR only)
 */
export async function getCompanyPayslips(month: number, year: number): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: currentProfile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!currentProfile || currentProfile.role !== 'Admin') return []

    const { data: payslips, error } = await supabase
      .from('payslips')
      .select(`
        *,
        profile:profiles!inner(name, department, location, company_id)
      `)
      .eq('month', month)
      .eq('year', year)
      .eq('profile.company_id', currentProfile.company_id)

    if (error) {
      console.error('Error fetching company payslips:', error)
      return []
    }

    return payslips || []
  } catch (error) {
    console.error('getCompanyPayslips catch:', error)
    return []
  }
}

/**
 * Fetch personal payslip history (Employee)
 */
export async function getMyPayslips(): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: payslips, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('profile_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      console.error('Error fetching my payslips:', error)
      return []
    }

    return payslips || []
  } catch (error) {
    console.error('getMyPayslips catch:', error)
    return []
  }
}
