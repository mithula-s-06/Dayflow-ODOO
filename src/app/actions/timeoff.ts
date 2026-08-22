'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface TimeOffBalance {
  leave_type: string
  total_days: number
  used_days: number
}

interface TimeOffData {
  allocations: TimeOffBalance[]
  requests: any[]
}

/**
 * Calculates business days between two dates (excluding weekends)
 */
function calculateBusinessDays(startStr: string, endStr: string): number {
  const start = new Date(startStr)
  const end = new Date(endStr)
  let count = 0
  const cur = new Date(start)

  while (cur <= end) {
    const dayOfWeek = cur.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/**
 * Fetch leave allocations and request history of the logged in user
 */
export async function getMyTimeOffData(): Promise<TimeOffData> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { allocations: [], requests: [] }

    const { data: allocations } = await supabase
      .from('time_off_allocations')
      .select('*')
      .eq('profile_id', user.id)

    const { data: requests } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('profile_id', user.id)
      .order('start_date', { ascending: false })

    return {
      allocations: allocations || [],
      requests: requests || [],
    }
  } catch (error) {
    console.error('getMyTimeOffData error:', error)
    return { allocations: [], requests: [] }
  }
}

/**
 * Submit a new leave request (Employee)
 */
export async function submitTimeOffRequest(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized.' }

    const leaveType = formData.get('leaveType') as 'Paid time off' | 'Sick Leave' | 'Unpaid Leaves'
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const remarks = formData.get('remarks') as string || null
    const attachmentUrl = formData.get('attachmentUrl') as string || null

    if (!leaveType || !startDate || !endDate) {
      return { success: false, message: 'Missing required fields.' }
    }

    const startObj = new Date(startDate)
    const endObj = new Date(endDate)
    if (endObj < startObj) {
      return { success: false, message: 'End date cannot be before start date.' }
    }

    // Calculate business days
    const numDays = calculateBusinessDays(startDate, endDate)
    if (numDays <= 0) {
      return { success: false, message: 'Selected date range contains no working days (weekends).' }
    }

    // Required attachment check for Sick Leave
    if (leaveType === 'Sick Leave' && !attachmentUrl) {
      return { success: false, message: 'Medical certificate upload is required for Sick Leave.' }
    }

    // Check balance for Paid and Sick leave
    if (leaveType !== 'Unpaid Leaves') {
      const { data: balance, error: balError } = await supabase
        .from('time_off_allocations')
        .select('*')
        .eq('profile_id', user.id)
        .eq('leave_type', leaveType)
        .single()

      if (balError || !balance) {
        return { success: false, message: 'No leave allocation found for ' + leaveType }
      }

      const available = balance.total_days - balance.used_days
      if (numDays > available) {
        return {
          success: false,
          message: `Insufficient leave balance. You have ${available} days available, but requested ${numDays} days.`,
        }
      }
    }

    // Insert request
    const { error: insertError } = await supabase
      .from('time_off_requests')
      .insert({
        profile_id: user.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        num_days: numDays,
        remarks,
        attachment_url: attachmentUrl,
        status: 'Pending',
      })

    if (insertError) {
      console.error('Insert leave request error:', insertError)
      return { success: false, message: 'Failed to submit leave request.' }
    }

    revalidatePath('/dashboard/timeoff')
    return { success: true, message: `Leave request of ${numDays} days successfully submitted!` }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Fetch all leave requests in the company (Admin/HR only)
 */
export async function getCompanyTimeOffRequests(): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: currentProfile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!currentProfile || currentProfile.role !== 'Admin') return []

    const { data: requests, error } = await supabase
      .from('time_off_requests')
      .select(`
        *,
        profile:profiles!inner(name, department, location, company_id)
      `)
      .eq('profile.company_id', currentProfile.company_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching company leave requests:', error)
      return []
    }

    return requests || []
  } catch (error) {
    console.error('getCompanyTimeOffRequests catch:', error)
    return []
  }
}

/**
 * Approve a leave request (Admin/HR only)
 */
export async function approveTimeOffRequest(
  requestId: string,
  adminComments: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, message: 'Unauthorized.' }

    // Fetch request details
    const { data: request, error: fetchError } = await adminSupabase
      .from('time_off_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { success: false, message: 'Leave request not found.' }
    }

    if (request.status !== 'Pending') {
      return { success: false, message: 'This request has already been resolved.' }
    }

    // 1. If it's Paid or Sick leave, check and deduct from allocation
    if (request.leave_type !== 'Unpaid Leaves') {
      const { data: allocation, error: allocError } = await adminSupabase
        .from('time_off_allocations')
        .select('*')
        .eq('profile_id', request.profile_id)
        .eq('leave_type', request.leave_type)
        .single()

      if (allocError || !allocation) {
        return { success: false, message: 'No leave allocation record found for employee.' }
      }

      // Increment used days
      const { error: deductError } = await adminSupabase
        .from('time_off_allocations')
        .update({ used_days: allocation.used_days + request.num_days })
        .eq('id', allocation.id)

      if (deductError) {
        console.error('Deduct leave balance error:', deductError)
        return { success: false, message: 'Failed to update employee leave balance.' }
      }
    }

    // 2. Mark request as Approved
    const { error: approveError } = await adminSupabase
      .from('time_off_requests')
      .update({
        status: 'Approved',
        approved_by: currentUser.id,
        admin_comments: adminComments,
      })
      .eq('id', requestId)

    if (approveError) {
      console.error('Approve request error:', approveError)
      return { success: false, message: 'Failed to save approval status.' }
    }

    // 3. Mark attendance status as 'Leave' for the approved dates (excluding weekends)
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    const cur = new Date(start)

    while (cur <= end) {
      const dayOfWeek = cur.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = cur.toISOString().split('T')[0]
        
        // Upsert attendance day as 'Leave'
        await adminSupabase
          .from('attendance')
          .upsert({
            profile_id: request.profile_id,
            date: dateStr,
            check_in: new Date(`${dateStr}T09:00:00Z`).toISOString(), // dummy placeholder clock
            check_out: new Date(`${dateStr}T17:00:00Z`).toISOString(),
            work_hours: 8.0,
            status: 'Leave'
          }, { onConflict: 'profile_id, date' })
      }
      cur.setDate(cur.getDate() + 1)
    }

    revalidatePath('/dashboard/timeoff')
    return { success: true, message: 'Leave request approved successfully!' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Reject a leave request (Admin/HR only)
 */
export async function rejectTimeOffRequest(
  requestId: string,
  adminComments: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, message: 'Unauthorized.' }

    // Update status to Rejected
    const { error } = await adminSupabase
      .from('time_off_requests')
      .update({
        status: 'Rejected',
        approved_by: currentUser.id,
        admin_comments: adminComments,
      })
      .eq('id', requestId)

    if (error) {
      console.error('Reject request error:', error)
      return { success: false, message: 'Failed to reject request.' }
    }

    revalidatePath('/dashboard/timeoff')
    return { success: true, message: 'Leave request rejected.' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}
