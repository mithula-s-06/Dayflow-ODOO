'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface AttendanceStatus {
  isCheckedIn: boolean
  checkInTime: string | null
  checkOutTime: string | null
  todayRecord: any | null
}

/**
 * Fetch the current user's check-in status for today
 */
export async function getCheckInStatus(): Promise<AttendanceStatus> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { isCheckedIn: false, checkInTime: null, checkOutTime: null, todayRecord: null }
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (error) {
      console.error('Error fetching check-in status:', error)
      return { isCheckedIn: false, checkInTime: null, checkOutTime: null, todayRecord: null }
    }

    if (!data) {
      return { isCheckedIn: false, checkInTime: null, checkOutTime: null, todayRecord: null }
    }

    return {
      isCheckedIn: data.check_in && !data.check_out,
      checkInTime: data.check_in,
      checkOutTime: data.check_out,
      todayRecord: data,
    }
  } catch (error) {
    console.error('getCheckInStatus catch:', error)
    return { isCheckedIn: false, checkInTime: null, checkOutTime: null, todayRecord: null }
  }
}

/**
 * Handle Clock-In action
 */
export async function clockIn(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized.' }
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const nowIso = new Date().toISOString()

    // Verify if already checked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, check_in, check_out')
      .eq('profile_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (existing) {
      if (!existing.check_out) {
        return { success: false, message: 'Already checked in for today.' }
      } else {
        return { success: false, message: 'You have already completed check-in and check-out for today.' }
      }
    }

    // Insert present attendance log
    const { error } = await supabase
      .from('attendance')
      .insert({
        profile_id: user.id,
        date: todayStr,
        check_in: nowIso,
        status: 'Present'
      })

    if (error) {
      console.error('Clock-in insert error:', error)
      return { success: false, message: 'Failed to record clock-in.' }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Successfully checked in!' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred during check-in.' }
  }
}

/**
 * Handle Clock-Out action
 */
export async function clockOut(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized.' }
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const nowIso = new Date().toISOString()

    // Fetch active check-in record
    const { data: activeLog, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (fetchError || !activeLog) {
      return { success: false, message: 'No check-in record found for today.' }
    }

    if (activeLog.check_out) {
      return { success: false, message: 'Already clocked out for today.' }
    }

    // Calculate work hours and extra hours
    const checkInTime = new Date(activeLog.check_in)
    const checkOutTime = new Date(nowIso)
    const diffMs = checkOutTime.getTime() - checkInTime.getTime()
    const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // 2 decimal places

    const standardHours = 8.0
    const extraHrs = diffHrs > standardHours ? Math.round((diffHrs - standardHours) * 100) / 100 : 0.0

    // Update attendance record
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        check_out: nowIso,
        work_hours: diffHrs,
        extra_hours: extraHrs,
        status: diffHrs >= 4.0 ? 'Present' : 'Half-day' // If worked less than 4 hours, counts as half-day
      })
      .eq('id', activeLog.id)

    if (updateError) {
      console.error('Clock-out update error:', updateError)
      return { success: false, message: 'Failed to record clock-out.' }
    }

    revalidatePath('/dashboard')
    return { success: true, message: `Successfully checked out! Worked ${diffHrs} hrs.` }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred during check-out.' }
  }
}

/**
 * Fetch personal attendance logs and calculated analytics for a given month/year
 */
export async function getMyAttendanceLogs(month: number, year: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { logs: [], presentCount: 0, leaveCount: 0, totalWorkingDays: 20 }

    // Start and end of the month (mathematical construction)
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`

    // Fetch attendance logs
    const { data: logs, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', user.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false })

    if (error) throw error

    // Fetch leaves taken in this month
    const { data: leaves } = await supabase
      .from('time_off_requests')
      .select('start_date, end_date, num_days')
      .eq('profile_id', user.id)
      .eq('status', 'Approved')
      .or(`and(start_date.lte.${endOfMonth},end_date.gte.${startOfMonth})`)

    // Count present days (Present or Half-day)
    const presentCount = logs?.filter(l => l.status === 'Present' || l.status === 'Half-day').length || 0

    // Count approved leave days within the month bounds
    let leaveCount = 0
    if (leaves) {
      const monthStartObj = new Date(year, month - 1, 1)
      const monthEndObj = new Date(year, month, 0)
      
      leaves.forEach(leave => {
        const start = new Date(leave.start_date)
        const end = new Date(leave.end_date)
        
        // Clamp to month bounds
        const clampStart = start < monthStartObj ? monthStartObj : start
        const clampEnd = end > monthEndObj ? monthEndObj : end
        
        // Compute active days
        const timeDiff = clampEnd.getTime() - clampStart.getTime()
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1
        leaveCount += days
      })
    }

    // Compute total working days in the month (excluding weekends)
    let totalWorkingDays = 0
    const totalDaysInMonth = new Date(year, month, 0).getDate()
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayOfWeek = new Date(year, month - 1, day).getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday and Not Saturday
        totalWorkingDays++
      }
    }

    return {
      logs: logs || [],
      presentCount,
      leaveCount,
      totalWorkingDays
    }
  } catch (error) {
    console.error('Error fetching employee attendance logs:', error)
    return { logs: [], presentCount: 0, leaveCount: 0, totalWorkingDays: 20 }
  }
}

/**
 * Fetch company-wide attendance logs for a specific date (Admin/HR only)
 */
export async function getCompanyAttendanceLogs(dateStr: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Verify Admin role
    const { data: currentProfile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!currentProfile || currentProfile.role !== 'Admin') return []

    // We join profiles, and filter by company
    const { data: logs, error } = await supabase
      .from('attendance')
      .select(`
        *,
        profile:profiles!inner(name, department, location, company_id)
      `)
      .eq('date', dateStr)
      .eq('profile.company_id', currentProfile.company_id)

    if (error) {
      console.error('Error fetching company attendance logs:', error)
      return []
    }

    return logs || []
  } catch (error) {
    console.error('getCompanyAttendanceLogs catch:', error)
    return []
  }
}
