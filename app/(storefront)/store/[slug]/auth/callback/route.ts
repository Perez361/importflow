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

  // Check if store customer already exists for this user
  const { data: existingCustomer } = await supabase
    .from('store_customers')
    .select('id, is_active')
    .eq('auth_id', user.id)
    .eq('importer_id', importer.id)
    .single()

  if (existingCustomer) {
    // Customer exists - update if inactive
    if (!existingCustomer.is_active) {
      await supabase
        .from('store_customers')
        .update({ is_active: true })
        .eq('id', existingCustomer.id)
    }
    
    // Update with latest metadata
    const { data: customer, error: customerError } = await supabase
      .from('store_customers')
      .update({
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
        phone: user.user_metadata?.phone || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_active: true,
      })
      .eq('id', existingCustomer.id)
      .select()
      .single()

    if (customerError) {
      console.error('[Store Callback] Error updating customer:', customerError)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/store/${slug}/login?error=update_failed`)
    }

    console.log('[Store Callback] Customer updated:', customer.id)
    
    // Sign out Supabase session - store customer uses localStorage only
    await supabase.auth.signOut()
    
    // Redirect to account with customer data
    const customerData = {
      id: customer.id,
      auth_id: user.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      importer_id: importer.id,
      avatar_url: customer.avatar_url
    }

    const encodedCustomer = encodeURIComponent(JSON.stringify(customerData))
    return NextResponse.redirect(`${origin}/store/${slug}/account?oauth_success=true&customer_data=${encodedCustomer}`)
  }

  // Create new store customer record
  const { data: customer, error: customerError } = await supabase
    .from('store_customers')
    .insert({
      importer_id: importer.id,
      auth_id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
      phone: user.user_metadata?.phone || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      password_hash: null,
      is_active: true,
    })
    .select()
    .single()

  if (customerError) {
    console.error('[Store Callback] Error creating customer:', customerError)
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=customer_creation_failed&message=${encodeURIComponent(customerError.message)}`)
  }

  console.log('[Store Callback] Customer created:', customer.id)

  // Sign out Supabase session - store customer uses localStorage only
  // This prevents session conflicts between dashboard and storefront
  await supabase.auth.signOut()
  console.log('[Store Callback] Signed out Supabase session - customer will use localStorage only')

  // Encode customer data to pass in URL for client-side localStorage
  const customerData = {
    id: customer.id,
    auth_id: user.id,
    name: customer.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
    email: customer.email || user.email || '',
    phone: customer.phone || user.user_metadata?.phone || null,
    address: customer.address || null,
    city: customer.city || null,
    importer_id: importer.id,
    avatar_url: customer.avatar_url || user.user_metadata?.avatar_url || null
  }

  const encodedCustomer = encodeURIComponent(JSON.stringify(customerData))

  // Redirect directly to account page
  const redirectUrl = `${origin}/store/${slug}/account?oauth_success=true&customer_data=${encodedCustomer}`
  
  console.log('[Store Callback] Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
}

