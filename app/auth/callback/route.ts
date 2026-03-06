import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()

  console.log('OAuth callback - code:', !!code, 'origin:', origin)

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieOptions = {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.delete({ name, ...options })
      },
    },
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieOptions
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  console.log('OAuth callback - user:', user.email)

  // Fetch user profile - this callback handles ONLY main auth users (importers/staff)
  // Store customers should use the store-specific callback at /store/[slug]/auth/callback
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create one with default importer role
  if (profileError || !profile) {
    console.log('Creating new user profile for OAuth user')
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'importer', // Default role for new OAuth users
        is_active: true,
      })

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
    }
    
    // Fetch the newly created profile
    const { data: newProfile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    
    if (!newProfile) {
      return NextResponse.redirect(`${origin}/login?error=profile_not_found`)
    }
    
    // Redirect based on role
    if (newProfile.role === 'super_admin' && newProfile.is_active) {
      return NextResponse.redirect(`${origin}/admin`)
    } else if (newProfile.is_active) {
      return NextResponse.redirect(`${origin}/dashboard`)
    } else {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=account_deactivated`)
    }
  }

  // User exists - redirect based on role
  if (profile.role === 'super_admin' && profile.is_active) {
    return NextResponse.redirect(`${origin}/admin`)
  } else if (profile.is_active) {
    return NextResponse.redirect(`${origin}/dashboard`)
  } else {
    // Account is deactivated
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=account_deactivated`)
  }
}

