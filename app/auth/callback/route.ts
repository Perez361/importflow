import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = await cookies()

  console.log('OAuth callback - code:', !!code, 'state:', state, 'origin:', origin)

  // Try to get slug from various sources (for store customers)
  let slug: string | null = null
  if (state) {
    try {
      const decodedState = decodeURIComponent(state)
      const stateData = JSON.parse(decodedState)
      slug = stateData.slug || null
      console.log('Slug from OAuth state:', slug)
    } catch (e) {
      console.error('Failed to parse OAuth state:', e)
    }
  }
  
  // From query parameter (fallback)
  if (!slug) {
    slug = searchParams.get('slug') || null
    console.log('Slug from query param:', slug)
  }
  
  // From cookies (fallback)
  if (!slug) {
    slug = cookieStore.get('oauth_slug')?.value || null
    console.log('Slug from cookie:', slug)
  }
  
  // From the URL path (fallback)
  if (!slug) {
    const pathname = new URL(request.url).pathname
    const pathParts = pathname.split('/').filter(Boolean)
    const storeIndex = pathParts.indexOf('store')
    if (storeIndex >= 0 && pathParts[storeIndex + 1]) {
      slug = pathParts[storeIndex + 1]
      console.log('Slug from URL path:', slug)
    }
  }

  console.log('OAuth callback - slug:', slug)

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(`${origin}/?error=no_code`)
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

  // If slug exists, this is a store customer login
  if (slug) {
    return handleStoreCustomerLogin(supabase, origin, slug, user)
  }

  // Otherwise, this is a main auth user (importer/staff)
  return handleMainAuthUser(supabase, origin, user)
}

// Handle store customer login (existing logic)
async function handleStoreCustomerLogin(supabase: any, origin: string, slug: string, user: any) {
  // Get the importer (store) by slug
  const { data: importer } = await supabase
    .from('importers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!importer) {
    console.error('Importer not found for slug:', slug)
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=store_not_found`)
  }

  // Create or update store customer record
  const { error: customerError } = await supabase
    .from('store_customers')
    .upsert({
      importer_id: importer.id,
      auth_id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
      phone: user.user_metadata?.phone || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      password_hash: null,
      is_active: true,
    }, {
      onConflict: 'importer_id, auth_id'
    })

  if (customerError) {
    console.error('Error creating customer:', customerError)
  }

  // Sign out the Supabase session - storefront uses localStorage
  await supabase.auth.signOut()
  console.log('Store customer logged in - session signed out')

  // Redirect to account page
  return NextResponse.redirect(`${origin}/store/${slug}/account?success=true`)
}

// Handle main auth user (importer/staff) login
async function handleMainAuthUser(supabase: any, origin: string, user: any) {
  // Fetch or create user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create one
  if (profileError || !profile) {
    console.log('Creating new user profile for OAuth user')
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'importer', // Default role for OAuth users
        is_active: true,
      })

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
    }
  }

  // Check user role and redirect accordingly
  const { data: finalProfile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!finalProfile) {
    return NextResponse.redirect(`${origin}/login?error=profile_not_found`)
  }

  if (finalProfile.role === 'super_admin' && finalProfile.is_active) {
    return NextResponse.redirect(`${origin}/admin`)
  } else if (finalProfile.is_active) {
    return NextResponse.redirect(`${origin}/dashboard`)
  } else {
    // Account is deactivated
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=account_deactivated`)
  }
}

