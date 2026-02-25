import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
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
    
    if (!error) {
      // Get the user to check their profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a profile in the users table
        const { data: profile } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (profile) {
          // Check if user is super_admin
          if (profile.role === 'super_admin') {
            return NextResponse.redirect(`${origin}/admin`)
          }
          
          // Check if user is active
          if (!profile.is_active) {
            // Sign out and redirect to login with error
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/login?error=account_deactivated`)
          }
          
          // Redirect to dashboard for regular users
          return NextResponse.redirect(`${origin}${next}`)
        }

        // No profile found - check if they're a store customer
        const { data: customer } = await supabase
          .from('store_customers')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (customer) {
          // Store customer trying to access admin - sign out
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=store_customer`)
        }

        // No profile at all
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=no_profile`)
      }
    }
    
    // If there's an error, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
