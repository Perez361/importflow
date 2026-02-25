import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  // Handle PKCE flow (code parameter)
  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Fetch user profile to verify super admin role
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          // Only redirect to admin if user is super_admin
          if (profile?.role === 'super_admin') {
            return NextResponse.redirect(`${origin}${next}`)
          } else {
            // Not a super admin, redirect to regular login with error
            return NextResponse.redirect(`${origin}/login?error=not_super_admin`)
          }
        }
        
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      console.error('Auth callback error:', error)
    } catch (err) {
      console.error('Auth callback exception:', err)
    }
  }

  // For implicit flow (access_token in URL hash), the client-side
  // will handle the session. Redirect to a client page that processes the hash.
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const type = searchParams.get('type')
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Handle email confirmation with token
  if (type === 'signup' || type === 'email' || token || accessToken) {
    // Redirect to the confirm page which will handle the hash client-side
    const confirmUrl = new URL('/admin/auth/confirm', origin)
    // Pass through any query params that might be needed
    if (next) confirmUrl.searchParams.set('next', next)
    if (type) confirmUrl.searchParams.set('type', type)
    if (accessToken) confirmUrl.searchParams.set('access_token', accessToken)
    if (refreshToken) confirmUrl.searchParams.set('refresh_token', refreshToken)
    if (token) confirmUrl.searchParams.set('token', token)
    return NextResponse.redirect(confirmUrl.toString())
  }

  // Return the user to an error page with instructions
  const errorUrl = new URL('/admin/auth/auth-code-error', origin)
  if (errorParam) errorUrl.searchParams.set('error', errorParam)
  if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)
  return NextResponse.redirect(errorUrl.toString())
}
