'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface OnboardResult {
  success: boolean
  message: string
  employeeId?: string
  tempPassword?: string
}

/**
 * Onboards a new employee (Admin/HR only)
 * Creates Auth account, Profile, Salary Config, and Default Leave Allocations.
 */
export async function onboardEmployee(formData: FormData): Promise<OnboardResult> {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    // Verify current user is Admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, message: 'Unauthorized.' }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id, role, company:companies(name)')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'Admin') {
      return { success: false, message: 'Only Admins/HR Officers can onboard employees.' }
    }

    const companyId = currentProfile.company_id
    const companyName = (Array.isArray(currentProfile.company) 
      ? currentProfile.company[0]?.name 
      : (currentProfile.company as any)?.name) || 'Company'

    // Extract form parameters
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string || null
    const role = formData.get('role') as 'Admin' | 'Employee' || 'Employee'
    const department = formData.get('department') as string || null
    const managerId = formData.get('managerId') as string || null
    const location = formData.get('location') as string || null
    const dateOfJoiningStr = formData.get('dateOfJoining') as string || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const monthlyWage = parseFloat(formData.get('monthlyWage') as string || '0')

    if (!name || !email) {
      return { success: false, message: 'Name and Email are required.' }
    }

    // 1. GENERATE CUSTOM LOGIN ID (EMPLOYEE ID)
    // Formula: [Company Abbv (2 letters)] + [First name (2 letters) + Last name (2 letters)] + [Joining Year (4)] + [Serial (4)]
    
    // Company Abbreviation
    const compClean = companyName.replace(/[^a-zA-Z ]/g, '').trim()
    const compWords = compClean.split(/\s+/)
    let compAbbv = 'DF'
    if (compWords.length >= 2) {
      compAbbv = (compWords[0][0] + compWords[1][0]).toUpperCase()
    } else if (compWords[0].length >= 2) {
      compAbbv = compWords[0].substring(0, 2).toUpperCase()
    }

    // Employee Initials
    const nameParts = name.trim().split(/\s+/)
    let empInitials = 'EX'
    if (nameParts.length >= 2) {
      const first = nameParts[0].substring(0, 2).padEnd(2, 'X')
      const last = nameParts[nameParts.length - 1].substring(0, 2).padEnd(2, 'X')
      empInitials = (first + last).toUpperCase()
    } else if (nameParts[0].length >= 4) {
      empInitials = nameParts[0].substring(0, 4).toUpperCase()
    } else {
      empInitials = nameParts[0].padEnd(4, 'X').toUpperCase()
    }

    // Year
    const joinYear = dateOfJoiningStr.split('-')[0]

    // Serial Number (count profiles in same company joined in the same year)
    const { count } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('date_of_joining', `${joinYear}-01-01`)
      .lte('date_of_joining', `${joinYear}-12-31`)

    const serialNum = String((count || 0) + 1).padStart(4, '0')
    const loginId = `${compAbbv}${empInitials}${joinYear}${serialNum}`

    // 2. Generate temporary password
    const tempPassword = `Dayflow@${joinYear}${serialNum}`

    // 3. Create auth user in Supabase (using service role admin client)
    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto confirms email for Admin-created accounts
      user_metadata: {
        company_id: companyId,
        role: role,
      }
    })

    if (authError || !newUser.user) {
      console.error('Admin create user error:', authError)
      return { success: false, message: authError?.message || 'Failed to create user login.' }
    }

    // 4. Create Profile in profiles table
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        company_id: companyId,
        login_id: loginId,
        email,
        name,
        phone,
        role,
        department,
        manager_id: managerId || null,
        location,
        date_of_joining: dateOfJoiningStr,
      })

    if (profileError) {
      console.error('Admin profile insert error:', profileError)
      await adminSupabase.auth.admin.deleteUser(newUser.user.id)
      return { success: false, message: 'Failed to create profile placeholder.' }
    }

    // 5. Create Salary Config
    const { error: salaryError } = await adminSupabase
      .from('salary_configs')
      .insert({
        profile_id: newUser.user.id,
        monthly_wage: monthlyWage,
      })

    if (salaryError) {
      console.error('Salary config creation error:', salaryError)
    }

    // 6. Create default Time Off Allocations
    const allocations = [
      { profile_id: newUser.user.id, leave_type: 'Paid time off', total_days: 24.0, used_days: 0.0 },
      { profile_id: newUser.user.id, leave_type: 'Sick Leave', total_days: 7.0, used_days: 0.0 },
      { profile_id: newUser.user.id, leave_type: 'Unpaid Leaves', total_days: 0.0, used_days: 0.0 },
    ]

    const { error: leaveError } = await adminSupabase
      .from('time_off_allocations')
      .insert(allocations)

    if (leaveError) {
      console.error('Leave allocations creation error:', leaveError)
    }

    revalidatePath('/dashboard')
    return {
      success: true,
      message: `Employee successfully onboarded! ID: ${loginId}`,
      employeeId: loginId,
      tempPassword,
    }
  } catch (error: any) {
    console.error('onboardEmployee catch:', error)
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}

/**
 * Update Company Details (Admin only)
 */
export async function updateCompanyDetails(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized.' }

    // Check if user is Admin and get their company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'Admin') {
      return { success: false, message: 'Only Admins can update company settings.' }
    }

    const companyId = profile.company_id
    const name = formData.get('companyName') as string
    const logoFile = formData.get('logoFile') as File | null

    if (!name) {
      return { success: false, message: 'Company Name is required.' }
    }

    const adminSupabase = createAdminClient()
    let logoUrl: string | null = null

    // Get current logo url in case they don't upload a new one
    const { data: existingCompany } = await adminSupabase
      .from('companies')
      .select('logo_url')
      .eq('id', companyId)
      .single()

    if (existingCompany) {
      logoUrl = existingCompany.logo_url
    }

    // Upload logo file if provided
    if (logoFile && logoFile.size > 0) {
      try {
        await adminSupabase.storage.createBucket('logos', { public: true })
      } catch (e) {
        // Ignore if exists
      }

      const fileExt = logoFile.name.split('.').pop() || 'png'
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`
      const fileBuffer = Buffer.from(await logoFile.arrayBuffer())

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('logos')
        .upload(fileName, fileBuffer, {
          contentType: logoFile.type,
          cacheControl: '3600',
          upsert: true
        })

      if (!uploadError) {
        const { data: { publicUrl } } = adminSupabase.storage
          .from('logos')
          .getPublicUrl(fileName)
        logoUrl = publicUrl
      } else {
        console.error('Logo upload error:', uploadError)
      }
    }

    const { error } = await adminSupabase
      .from('companies')
      .update({ name, logo_url: logoUrl })
      .eq('id', companyId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, message: 'Company settings updated successfully!' }
  } catch (error: any) {
    console.error('updateCompanyDetails error:', error)
    return { success: false, message: error.message || 'Failed to update company settings.' }
  }
}
