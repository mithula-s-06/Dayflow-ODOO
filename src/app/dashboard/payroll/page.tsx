import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/actions/profile'
import PayrollManager from '@/components/PayrollManager'

export default async function PayrollPage() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Restrict access to HR Admins only
  if (profile.role !== 'Admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-slate-100">
          Salary & Payroll Control
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate monthly payslips, track department budget weightings, and inspect individual salary slip statements.
        </p>
      </div>

      <PayrollManager />
    </div>
  )
}
