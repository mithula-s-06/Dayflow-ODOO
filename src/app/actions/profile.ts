'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProfileWithCompany {
  id: string
  company_id: string
  login_id: string | null
  email: string
  name: string
  phone: string | null
  role: 'Admin' | 'Employee'
  avatar_url: string | null
  department: string | null
  manager_id: string | null
  location: string | null
  date_of_joining: string
  date_of_birth: string | null
  residing_address: string | null
  nationality: string | null
  gender: string | null
  marital_status: string | null
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  pan_no: string | null
  uan_no: string | null
  about: string | null
  what_i_love: string | null
  interests: string | null
  company: {
    id: string
    name: string
    logo_url: string | null
  }
}

/**
 * Fetch the currently authenticated user's profile and company details
 */
export async function getCurrentUserProfile(): Promise<ProfileWithCompany | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching current user profile:', error)
      return null
    }

    return profile as unknown as ProfileWithCompany
  } catch (error) {
    console.error('getCurrentUserProfile catch:', error)
    return null
  }
}

/**
 * Update limited contact fields of the current user's profile (address, phone, avatar)
 */
export async function updateOwnProfile(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized.' }
    }

    const phone = formData.get('phone') as string
    const residing_address = formData.get('address') as string
    const avatar_url = formData.get('avatarUrl') as string

    const { error } = await supabase
      .from('profiles')
      .update({
        phone: phone || null,
        residing_address: residing_address || null,
        avatar_url: avatar_url || null
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating own profile:', error)
      return { success: false, message: 'Failed to update profile.' }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Profile updated successfully!' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error updating profile.' }
  }
}

/**
 * Add a skill or certification
 */
export async function addSkill(
  profileId: string, 
  name: string, 
  type: 'skill' | 'certification',
  documentUrl?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    // Check if owner or admin
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isOwner = user.id === profileId
    const isAdmin = currentProfile?.role === 'Admin'

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Permission denied.' }
    }

    const { data, error } = await supabase
      .from('skills')
      .insert({ 
        profile_id: profileId, 
        name, 
        type,
        document_url: documentUrl || null
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/employees/${profileId}`)
    return { success: true, message: 'Skill/Certification added.', data }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Upload a certificate document (supports PDFs and images)
 */
export async function uploadCertificate(formData: FormData): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    const file = formData.get('file') as File
    if (!file) return { success: false, message: 'No file uploaded.' }

    const fileExt = file.name.split('.').pop()
    const fileName = `certificates/${user.id}-${Date.now()}.${fileExt}`

    // Upload to 'avatars' bucket (publicly readable general-purpose files bucket)
    const { data, error } = await adminSupabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = adminSupabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return { success: true, url: publicUrl, message: 'File uploaded successfully.' }
  } catch (error: any) {
    console.error('uploadCertificate error:', error)
    return { success: false, message: error.message || 'Failed to upload certificate.' }
  }
}

/**
 * Remove a skill or certification
 */
export async function deleteSkill(skillId: string, profileId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isOwner = user.id === profileId
    const isAdmin = currentProfile?.role === 'Admin'

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Permission denied.' }
    }

    const { error } = await supabase.from('skills').delete().eq('id', skillId)
    if (error) throw error

    revalidatePath(`/dashboard/employees/${profileId}`)
    return { success: true, message: 'Skill/Certification deleted.' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Update Profile Resume Text (About, What I love, Interests)
 */
export async function updateProfileResume(profileId: string, about: string, whatILove: string, interests: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isOwner = user.id === profileId
    const isAdmin = currentProfile?.role === 'Admin'

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Permission denied.' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ about, what_i_love: whatILove, interests })
      .eq('id', profileId)

    if (error) throw error

    revalidatePath(`/dashboard/employees/${profileId}`)
    return { success: true, message: 'Profile highlights updated.' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Update Profile Private Info (Admin can update all, Employee can update only limited contact fields)
 */
export async function updatePrivateInfo(profileId: string, fields: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isOwner = user.id === profileId
    const isAdmin = currentProfile?.role === 'Admin'

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Permission denied.' }
    }

    let payload: any = {}
    if (isAdmin) {
      payload = {
        name: fields.name,
        phone: fields.phone,
        department: fields.department,
        location: fields.location,
        manager_id: fields.managerId === 'NONE' ? null : fields.managerId,
        date_of_joining: fields.dateOfJoining,
        date_of_birth: fields.dateOfBirth || null,
        residing_address: fields.residingAddress || null,
        nationality: fields.nationality || null,
        gender: fields.gender || null,
        marital_status: fields.maritalStatus || null,
        bank_name: fields.bankName || null,
        account_number: fields.accountNumber || null,
        ifsc_code: fields.ifscCode || null,
        pan_no: fields.panNo || null,
        uan_no: fields.uanNo || null
      }
    } else {
      payload = {
        phone: fields.phone,
        residing_address: fields.residingAddress || null
      }
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', profileId)
    if (error) throw error

    revalidatePath(`/dashboard/employees/${profileId}`)
    return { success: true, message: 'Profile details updated.' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Update Salary Configuration (Admin only)
 */
export async function updateSalaryConfig(profileId: string, fields: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (currentProfile?.role !== 'Admin') {
      return { success: false, message: 'Permission denied. Only Admins can modify salary details.' }
    }

    const payload = {
      monthly_wage: parseFloat(fields.monthlyWage || '0'),
      working_days_per_week: parseInt(fields.workingDaysPerWeek || '5'),
      working_hours_per_day: parseFloat(fields.workingHoursPerDay || '8'),
      basic_salary_pct: parseFloat(fields.basicSalaryPct || '50'),
      hra_pct: parseFloat(fields.hraPct || '50'),
      standard_allowance: parseFloat(fields.standardAllowance || '4167'),
      performance_bonus_pct: parseFloat(fields.performanceBonusPct || '8.33'),
      lta_pct: parseFloat(fields.ltaPct || '8.33'),
      pf_rate: parseFloat(fields.pfRate || '12'),
      professional_tax: parseFloat(fields.professionalTax || '200')
    }

    const { error } = await supabase
      .from('salary_configs')
      .upsert({ profile_id: profileId, ...payload })

    if (error) throw error

    revalidatePath(`/dashboard/employees/${profileId}`)
    return { success: true, message: 'Salary config updated successfully.' }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error occurred.' }
  }
}

/**
 * Upload profile picture avatar (Owner or Admin)
 */
export async function uploadAvatar(profileId: string, formData: FormData): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, message: 'Unauthorized' }

    // Check if owner or admin
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
    const isOwner = currentUser.id === profileId
    const isAdmin = currentProfile?.role === 'Admin'

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Permission denied.' }
    }

    const file = formData.get('file') as File
    if (!file) return { success: false, message: 'No file uploaded.' }

    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${profileId}-${Date.now()}.${fileExt}`

    const { data, error } = await adminSupabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = adminSupabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profileId)

    if (updateError) throw updateError

    revalidatePath(`/dashboard/employees/${profileId}`)
    revalidatePath('/dashboard')
    return { success: true, url: publicUrl, message: 'Avatar updated successfully.' }
  } catch (error: any) {
    console.error('uploadAvatar error:', error)
    return { success: false, message: error.message || 'Failed to upload avatar.' }
  }
}
