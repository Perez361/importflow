import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Extract slug from URL path: /store/{slug}/auth/callback
  const pathParts = pathname.split('/').filter(Boolean)
  const storeIndex = pathParts.indexOf('store')
  let slug = null
  if (storeIndex >= 0 && pathParts[storeIndex + 1]) {
    slug = pathParts[storeIndex + 1]
  }
  
  console.log('Store callback - pathname:', pathname)
  console.log('Store callback - extracted slug:', slug)
  console.log('Store callback - code:', !!code)

  if (!code || !slug) {
    console.error('Missing code or slug - code:', !!code, 'slug:', slug)
    return NextResponse.redirect(`${origin}/?error=invalid_callback`)
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
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=auth_failed`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/store/${slug}/login?error=no_user`)
  }

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
  const { data: customer, error: customerError } = await supabase
    .from('store_customers')
    .upsert({
      importer_id: importer.id,
      auth_id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
      phone: user.user_metadata?.phone || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    }, {
      onConflict: 'importer_id, auth_id'
    })
    .select()
    .single()

  if (customerError) {
    console.error('Error creating customer:', customerError)
    // Continue anyway, as the user is authenticated
  }

  // Encode customer data to pass in URL
  const customerData = {
    id: customer?.id,
    auth_id: user.id,
    name: customer?.name || user.email?.split('@')[0] || 'Customer',
    email: customer?.email || user.email || '',
    phone: customer?.phone,
    address: customer?.address,
    city: customer?.city,
    importer_id: importer.id
  }

  // Redirect to login page which will set localStorage and redirect to account
  // This ensures localStorage is set properly on the client side
  const encodedCustomer = encodeURIComponent(JSON.stringify(customerData))
  return NextResponse.redirect(`${origin}/store/${slug}/login?customer_data=${encodedCustomer}&redirect=/store/${slug}/account`)
}
