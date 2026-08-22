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
    <HeaderNav profile={profile}>
      {children}
    </HeaderNav>
  )
}
