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

  // Create a server client WITHOUT cookie handling to avoid overwriting importer sessions
  // This prevents session conflicts between dashboard and storefront users
  // Storefront customers only use localStorage, not Supabase auth cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Do nothing - don't set any cookies for storefront customers
          // This prevents overwriting the importer's session
        },
      },
    }
  )

  // Exchange code for session to get user info (but don't set cookies)
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
  // First try to insert directly (not upsert) to see if customer exists
  const { data: existingCustomer } = await supabase
    .from('store_customers')
    .select('*')
    .eq('importer_id', importer.id)
    .eq('auth_id', user.id)
    .single()

  if (existingCustomer) {
    console.log('[Store Callback] Customer already exists:', existingCustomer.id)
  }

  // Now try upsert - use auth_id conflict resolution (available after migration 012)
  // Also include password_hash as null for OAuth users
  const { data: customer, error: customerError } = await supabase
    .from('store_customers')
    .upsert({
      importer_id: importer.id,
      auth_id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
      phone: user.user_metadata?.phone || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      password_hash: null, // OAuth users don't have password
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
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=customer_creation_failed`)
  }

  console.log('[Store Callback] Customer created/updated:', finalCustomer.id)

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

  // Redirect directly to account page instead of going through login page
  // This is more reliable and faster
  const redirectUrl = `${origin}/store/${slug}/account?oauth_success=true&customer_data=${encodedCustomer}`
  
  console.log('[Store Callback] Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
}

