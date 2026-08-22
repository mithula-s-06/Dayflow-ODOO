import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/actions/profile'
import AttendanceManager from '@/components/AttendanceManager'

export default async function AttendancePage() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-slate-100">
          Attendance Tracker
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {profile.role === 'Admin'
            ? 'Monitor and manage corporate attendance logs for all employees.'
            : 'Track your clock logs, worked hours, and check monthly statistics.'}
        </p>
      </div>

      <AttendanceManager role={profile.role} />
    </div>
  )
}
