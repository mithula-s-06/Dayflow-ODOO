import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUserProfile } from '@/app/actions/profile'
import { getEmployeesWithStatus } from '@/app/actions/dashboard'
import AdminDashboard from '@/components/AdminDashboard'
import EmployeeDashboard from '@/components/EmployeeDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Fetch current profile
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // 2. Render Admin or Employee dashboard based on role
  if (profile.role === 'Admin') {
    const employees = await getEmployeesWithStatus()
    return <AdminDashboard initialEmployees={employees} currentUserId={profile.id} />
  } else {
    // Fetch leave allocations balance
    const { data: leaveBalances } = await supabase
      .from('time_off_allocations')
      .select('leave_type, total_days, used_days')
      .eq('profile_id', profile.id)

    // Fetch recent check-in logs (latest 5)
    const { data: recentClocks } = await supabase
      .from('attendance')
      .select('date, check_in, check_out, status')
      .eq('profile_id', profile.id)
      .order('date', { ascending: false })
      .limit(5)

    return (
      <EmployeeDashboard
        profile={profile}
        leaveBalances={leaveBalances || []}
        recentClocks={recentClocks || []}
      />
    )
  }
}
