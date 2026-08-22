import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/actions/profile'
import HeaderNav from '@/components/HeaderNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header Panel */}
      <HeaderNav profile={profile} />
      
      {/* Page Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
