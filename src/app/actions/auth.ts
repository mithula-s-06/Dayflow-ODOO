'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Password validation regex
// Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

interface AuthResponse {
  success: boolean
  message: string
}

/**
 * Validates password strength rules.
 */
function isPasswordStrong(password: string): boolean {
  return passwordRegex.test(password)
}

/**
 * HR / Company Signup Action
 */
export async function signUpHR(formData: FormData): Promise<AuthResponse> {
  const companyName = formData.get('companyName') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const logoFile = formData.get('logoFile') as File | null

  if (!companyName || !name || !email || !password) {
    return { success: false, message: 'All required fields must be filled.' }
  }

  if (password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }

  if (!isPasswordStrong(password)) {
    return {
      success: false,
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }
  }

  try {
    const adminSupabase = createAdminClient()
    let logoUrl: string | null = null

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

    // 1. Create company first (using admin client to bypass RLS)
    const { data: company, error: companyError } = await adminSupabase
      .from('companies')
      .insert({ name: companyName, logo_url: logoUrl })
      .select('id')
      .single()

    if (companyError || !company) {
      console.error('Company creation error:', companyError)
      return { success: false, message: 'Failed to register company details.' }
    }

    // 2. Sign up the HR user via standard Supabase auth
    // We pass company_id and role in user_metadata so that they are embedded in their JWT
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          company_id: company.id,
          role: 'Admin',
        },
      },
    })

    if (authError || !authData.user) {
      // Cleanup company if auth fails
      await adminSupabase.from('companies').delete().eq('id', company.id)
      return { success: false, message: authError?.message || 'Authentication signup failed.' }
    }

    // 3. Create the profile in profiles table
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: company.id,
        email,
        name,
        phone,
        role: 'Admin',
        is_activated: true, // Admin is activated immediately
        date_of_joining: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      })

    if (profileError) {
      console.error('Admin profile insertion error:', profileError)
      // Note: User can still verify their email, but database profile failed. We delete auth user in case of failure.
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      await adminSupabase.from('companies').delete().eq('id', company.id)
      return { success: false, message: 'Profile configuration failed.' }
    }

    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    }
  } catch (error: any) {
    console.error('Sign up HR error:', error)
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}

/**
 * Employee Registration / Activation Action
 */
export async function activateEmployee(formData: FormData): Promise<AuthResponse> {
  const loginId = formData.get('loginId') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!loginId || !email || !password) {
    return { success: false, message: 'All fields are required.' }
  }

  if (password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }

  if (!isPasswordStrong(password)) {
    return {
      success: false,
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }
  }

  try {
    const adminSupabase = createAdminClient()

    // 1. Verify placeholder profile exists with the pre-allocated Login ID & Email
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, company_id')
      .eq('login_id', loginId.trim().toUpperCase())
      .eq('email', email.trim().toLowerCase())
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        message: 'No pre-allocated profile found matching this Employee ID and Email. Please contact your HR department.',
      }
    }

    // 2. Update their auth password. 
    // Since HR already created the auth user, we update their password.
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      profile.id,
      { 
        password,
        email_confirm: false // Forces email verification
      }
    )

    if (updateError) {
      console.error('Update employee auth error:', updateError)
      return { success: false, message: 'Failed to register account credentials.' }
    }

    // 3. Mark profile as activated in database
    const { error: activateError } = await adminSupabase
      .from('profiles')
      .update({ is_activated: true })
      .eq('id', profile.id)

    if (activateError) {
      console.error('Mark employee activated error:', activateError)
      return { success: false, message: 'Failed to activate profile.' }
    }

    // 3. Resend verification email to the user
    const supabase = await createClient()
    const { error: verificationError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    })

    if (verificationError) {
      console.error('Resend verification error:', verificationError)
      // Don't fail the whole request, they can sign in or request reset, but notify them
    }

    return {
      success: true,
      message: 'Registration successful! An email verification link has been sent to ' + email + '.',
    }
  } catch (error: any) {
    console.error('Activate employee error:', error)
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}

/**
 * Sign In Action
 * Accepts either Email or Employee Login ID
 */
export async function signIn(formData: FormData): Promise<AuthResponse> {
  const loginInput = formData.get('loginInput') as string // Can be email or login_id (Employee ID)
  const password = formData.get('password') as string

  if (!loginInput || !password) {
    return { success: false, message: 'All fields are required.' }
  }

  try {
    let email = loginInput.trim()
    let isActivated = true

    // 1. If it's not an email, lookup profile by Login ID (Employee ID)
    if (!email.includes('@')) {
      const adminSupabase = createAdminClient()
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('email, is_activated')
        .eq('login_id', email.toUpperCase())
        .single()

      if (profileError || !profile) {
        return { success: false, message: 'This Login ID is not registered in our database. Please check your credentials.' }
      }
      email = profile.email
      isActivated = profile.is_activated
    } else {
      const adminSupabase = createAdminClient()
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('is_activated')
        .eq('email', email.toLowerCase())
        .single()

      if (profileError || !profile) {
        return { success: false, message: 'This email is not registered in our database. Please check your credentials.' }
      }
      isActivated = profile.is_activated
    }

    if (!isActivated) {
      return { success: false, message: 'Please activate your account first by choosing a new password.' }
    }

    // 2. Sign in with Email and Password
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return { success: false, message: authError.message }
    }

    // Revalidate paths to load correct dashboard
    revalidatePath('/dashboard')

    return { success: true, message: 'Login successful!' }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}

/**
 * Sign Out Action
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, message: error.message }
    return { success: true, message: 'Signed out successfully.' }
  } catch (error: any) {
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}

/**
 * Change Password Action (for active session)
 */
export async function changePassword(password: string): Promise<AuthResponse> {
  try {
    if (!isPasswordStrong(password)) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      }
    }
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true, message: 'Password updated successfully!' }
  } catch (error: any) {
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}
