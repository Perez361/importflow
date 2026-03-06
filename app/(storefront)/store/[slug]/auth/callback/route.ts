import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Get slug from params - this is the proper way in Next.js App Router
  const { slug } = await params
  
  console.log('[Store Callback] pathname:', request.nextUrl.pathname)
  console.log('[Store Callback] extracted slug:', slug)
  console.log('[Store Callback] code:', !!code)
  console.log('[Store Callback] origin:', origin)

  if (!code || !slug) {
    console.error('[Store Callback] Missing code or slug - code:', !!code, 'slug:', slug)
    return NextResponse.redirect(`${origin}/?error=invalid_callback`)
  }

  const cookieStore = await cookies()

  // Use standard cookie handling for OAuth to work
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

  // Exchange code for session
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Store Callback] Error exchanging code for session:', exchangeError)
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('[Store Callback] No user found after exchange')
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=no_user`)
  }

  console.log('[Store Callback] User authenticated:', user.email)

  // Get the importer (store) by slug
  const { data: importer, error: importerError } = await supabase
    .from('importers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (importerError || !importer) {
    console.error('[Store Callback] Importer not found for slug:', slug, importerError)
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=store_not_found`)
  }

  console.log('[Store Callback] Importer found:', importer.id)

  // Create or update store customer record
  const { data: customer, error: customerError } = await supabase
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
    .select()
    .single()

  console.log('[Store Callback] Upsert result:', { customer, customerError })

  // If upsert failed or didn't return data, fetch the customer
  let finalCustomer = customer
  if (customerError || !finalCustomer) {
    console.log('[Store Callback] Fetching existing customer after upsert')
    const { data: fetchedCustomer, error: fetchError } = await supabase
      .from('store_customers')
      .select('*')
      .eq('importer_id', importer.id)
      .eq('auth_id', user.id)
      .single()
    
    console.log('[Store Callback] Fetch result:', { fetchedCustomer, fetchError })
    finalCustomer = fetchedCustomer
  }

  if (!finalCustomer) {
    console.error('[Store Callback] Could not find or create customer')
    // Sign out before redirecting
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=customer_creation_failed`)
  }

  console.log('[Store Callback] Customer created/updated:', finalCustomer.id)

  // Also create/update user in users table with 'customer' role
  // This allows store customers to have a proper user record for auth purposes
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (existingUser) {
    // User exists - update to customer role (store customers should always be customer)
    // This ensures even existing importers get updated to customer
    if (existingUser.role !== 'customer') {
      await supabase
        .from('users')
        .update({ role: 'customer' })
        .eq('id', user.id)
      console.log('[Store Callback] Updated user role to customer')
    }
  } else {
    // Create new user with customer role
    await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: finalCustomer.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        role: 'customer',
        is_active: true,
      })
    console.log('[Store Callback] Created user with customer role')
  }

  // CRITICAL: Sign out the Supabase session after creating the customer
  // This prevents session conflicts between dashboard and storefront
  // Storefront customers only use localStorage, not Supabase auth cookies
  await supabase.auth.signOut()
  console.log('[Store Callback] Signed out Supabase session - customer will use localStorage only')

  // Encode customer data to pass in URL for client-side localStorage
  const customerData = {
    id: finalCustomer.id,
    auth_id: user.id,
    name: finalCustomer.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
    email: finalCustomer.email || user.email || '',
    phone: finalCustomer.phone || user.user_metadata?.phone || null,
    address: finalCustomer.address || null,
    city: finalCustomer.city || null,
    importer_id: importer.id
  }

  const encodedCustomer = encodeURIComponent(JSON.stringify(customerData))

  // Redirect directly to account page
  const redirectUrl = `${origin}/store/${slug}/account?oauth_success=true&customer_data=${encodedCustomer}`
  
  console.log('[Store Callback] Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
}

