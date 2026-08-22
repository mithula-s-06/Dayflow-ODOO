'use server'

import { createClient } from '@/utils/supabase/server'

export interface EmployeeWithStatus {
  id: string
  name: string
  email: string
  login_id: string | null
  phone: string | null
  role: 'Admin' | 'Employee'
  avatar_url: string | null
  department: string | null
  location: string | null
  todayStatus: 'Present' | 'Present-completed' | 'Absent' | 'Leave'
  todayAttendance: {
    check_in: string
    check_out: string | null
    status: string
  } | null
}

/**
 * Fetch all employees in the current user's company along with their computed status for today
 */
export async function getEmployeesWithStatus(): Promise<EmployeeWithStatus[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch current user's company
    const { data: currentUser, error: curError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (curError || !currentUser) {
      return []
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

    // Fetch all profiles in company
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, name, email, login_id, phone, role, avatar_url, department, location')
      .eq('company_id', currentUser.company_id)
      .order('name', { ascending: true })

    if (profError || !profiles) {
      console.error('Error loading company profiles:', profError)
      return []
    }

    // Fetch today's attendance logs for company
    const { data: attendances } = await supabase
      .from('attendance')
      .select('profile_id, check_in, check_out, status')
      .eq('date', todayStr)

    // Fetch today's active leaves (Approved status, and today falls between start and end date)
    const { data: activeLeaves } = await supabase
      .from('time_off_requests')
      .select('profile_id')
      .eq('status', 'Approved')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)

    const leaveSet = new Set(activeLeaves?.map(l => l.profile_id) || [])
    const attendanceMap = new Map(attendances?.map(a => [a.profile_id, a]) || [])

    return profiles.map(p => {
      const todayAtt = attendanceMap.get(p.id) || null
      let computedStatus: 'Present' | 'Present-completed' | 'Absent' | 'Leave' = 'Absent'

      if (leaveSet.has(p.id)) {
        computedStatus = 'Leave'
      } else if (todayAtt) {
        if (todayAtt.check_in && !todayAtt.check_out) {
          computedStatus = 'Present'
        } else if (todayAtt.check_in && todayAtt.check_out) {
          computedStatus = 'Present-completed'
        }
      }

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        login_id: p.login_id,
        phone: p.phone,
        role: p.role as 'Admin' | 'Employee',
        avatar_url: p.avatar_url,
        department: p.department,
        location: p.location,
        todayStatus: computedStatus,
        todayAttendance: todayAtt ? {
          check_in: todayAtt.check_in,
          check_out: todayAtt.check_out,
          status: todayAtt.status
        } : null
      }
    })
  } catch (error) {
    console.error('getEmployeesWithStatus catch:', error)
    return []
  }
}
