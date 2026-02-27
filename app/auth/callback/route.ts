import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()

  // Try to get slug from various sources
  // 1. From query parameter
  let slug = searchParams.get('slug')
  
  // 2. From cookies (set by login/register pages)
  if (!slug) {
    slug = cookieStore.get('oauth_slug')?.value || null
    console.log('Slug from cookie:', slug)
  }
  
  // 3. Or from the URL path
  if (!slug) {
    const pathname = new URL(request.url).pathname
    const pathParts = pathname.split('/').filter(Boolean)
    // path structure could be: ['auth', 'callback'] or ['store', '{slug}', 'auth', 'callback']
    const storeIndex = pathParts.indexOf('store')
    if (storeIndex >= 0 && pathParts[storeIndex + 1]) {
      slug = pathParts[storeIndex + 1]
    }
  }

  console.log('OAuth callback - code:', !!code, 'slug:', slug, 'origin:', origin)


  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  // If no slug found, redirect to home with error
  if (!slug) {
    console.error('No slug found, redirecting to home')
    return NextResponse.redirect(`${origin}/?error=no_slug`)
  }

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
  const { error: customerError } = await supabase
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

  if (customerError) {
    console.error('Error creating customer:', customerError)
  }

  // Redirect to account page
  return NextResponse.redirect(`${origin}/store/${slug}/account?success=true`)
}
