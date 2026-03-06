import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Get slug from params
  const { slug } = await params
  
  console.log('[Store Confirm] pathname:', request.nextUrl.pathname)
  console.log('[Store Confirm] extracted slug:', slug)
  console.log('[Store Confirm] code:', !!code)

  if (!code || !slug) {
    console.error('[Store Confirm] Missing code or slug')
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=invalid_confirmation`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  // Exchange code for session (this works for email confirmation too)
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Store Confirm] Error exchanging code for session:', exchangeError)
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('[Store Confirm] No user found after exchange')
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=no_user`)
  }

  console.log('[Store Confirm] User confirmed:', user.email)

  // Get the importer (store) by slug
  const { data: importer, error: importerError } = await supabase
    .from('importers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (importerError || !importer) {
    console.error('[Store Confirm] Importer not found for slug:', slug, importerError)
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=store_not_found`)
  }

  console.log('[Store Confirm] Importer found:', importer.id)

  // Create store_customers record
  const { data: customer, error: customerError } = await supabase
    .from('store_customers')
    .upsert({
      importer_id: importer.id,
      auth_id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
      phone: user.user_metadata?.phone || null,
      address: user.user_metadata?.address || null,
      city: user.user_metadata?.city || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      password_hash: null,
      is_active: true,
    }, {
      onConflict: 'importer_id, auth_id'
    })
    .select()
    .single()

  if (customerError) {
    console.error('[Store Confirm] Error creating store customer:', customerError)
  }

  console.log('[Store Confirm] Customer created/updated:', customer?.id)

  // Create/update users table with 'customer' role
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (existingUser) {
    // Update to customer role if not already importer/super_admin
    if (existingUser.role !== 'importer' && existingUser.role !== 'super_admin') {
      await supabase
        .from('users')
        .update({ role: 'customer' })
        .eq('id', user.id)
      console.log('[Store Confirm] Updated user role to customer')
    }
  } else {
    // Create new user with customer role
    await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
        role: 'customer',
        is_active: true,
      })
    console.log('[Store Confirm] Created user with customer role')
  }

  // Sign out the Supabase session - customer will use localStorage
  await supabase.auth.signOut()
  console.log('[Store Confirm] Signed out - customer will use localStorage')

  // Redirect to login with success
  const redirectUrl = `${origin}/store/${slug}/login?confirmed=true`
  
  console.log('[Store Confirm] Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
}

