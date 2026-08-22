import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUserProfile, ProfileWithCompany } from '@/app/actions/profile'
import ProfileDetails from '@/components/ProfileDetails'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Get current logged in user details
  const currentUser = await getCurrentUserProfile()
  if (!currentUser) {
    redirect('/login')
  }

  // 2. Fetch viewed profile details (joined with company)
  const { data: viewedProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', id)
    .single()

  if (profileError || !viewedProfile) {
    notFound()
  }

  // 3. Fetch skills & certifications
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('profile_id', id)
    .order('created_at', { ascending: true })

  // 4. Fetch salary config (Only load if current user is Admin)
  let salaryConfig = null
  if (currentUser.role === 'Admin') {
    const { data: salConfig } = await supabase
      .from('salary_configs')
      .select('*')
      .eq('profile_id', id)
      .maybeSingle()
    salaryConfig = salConfig
  }

  // 5. Fetch all profiles for manager selection dropdown
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('company_id', currentUser.company_id)
    .order('name', { ascending: true })

  return (
    <ProfileDetails
      viewedProfile={viewedProfile as unknown as ProfileWithCompany}
      currentUser={{ id: currentUser.id, role: currentUser.role }}
      skills={skills || []}
      salaryConfig={salaryConfig}
      managersList={managers || []}
    />
  )
}
