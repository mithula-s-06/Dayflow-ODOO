import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/actions/profile'
import { getMyTimeOffData, getCompanyTimeOffRequests } from '@/app/actions/timeoff'
import TimeOffManager from '@/components/TimeOffManager'

export default async function TimeOffPage() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect('/login')
  }

  let allocations: any[] = []
  let requests: any[] = []

  if (profile.role === 'Admin') {
    requests = await getCompanyTimeOffRequests()
  } else {
    const data = await getMyTimeOffData()
    allocations = data.allocations
    requests = data.requests
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-slate-100">
          Leave & Time Off
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {profile.role === 'Admin'
            ? 'Process pending employee leave applications and add comments.'
            : 'Request paid or sick leave and view your yearly calendar highlights.'}
        </p>
      </div>

      <TimeOffManager
        role={profile.role}
        initialAllocations={allocations}
        initialRequests={requests}
        employeeName={profile.name}
      />
    </div>
  )
}
