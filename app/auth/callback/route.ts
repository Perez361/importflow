import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle PKCE flow (code parameter)
  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      console.error('Auth callback error:', error)
    } catch (err) {
      console.error('Auth callback exception:', err)
    }
  }

  // For implicit flow (access_token in URL hash), the client-side
  // will handle the session. Redirect to a client page that processes the hash.
  // The hash fragment is not sent to the server, so we redirect to a page
  // that can handle it client-side.
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const type = searchParams.get('type')
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Handle email confirmation with token
  if (type === 'signup' || type === 'email' || token || accessToken) {
    // Redirect to the confirm page which will handle the hash client-side
    const confirmUrl = new URL('/auth/confirm', origin)
    // Pass through any query params that might be needed
    if (next) confirmUrl.searchParams.set('next', next)
    if (type) confirmUrl.searchParams.set('type', type)
    if (accessToken) confirmUrl.searchParams.set('access_token', accessToken)
    if (refreshToken) confirmUrl.searchParams.set('refresh_token', refreshToken)
    if (token) confirmUrl.searchParams.set('token', token)
    return NextResponse.redirect(confirmUrl.toString())
  }

  // Return the user to an error page with instructions
  const errorUrl = new URL('/auth/auth-code-error', origin)
  if (errorParam) errorUrl.searchParams.set('error', errorParam)
  if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)
  return NextResponse.redirect(errorUrl.toString())
}
