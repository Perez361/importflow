import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

// Proxy function - handles auth session and redirects for protected routes
export async function middleware(request: NextRequest) {
  return proxy(request)
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes configuration
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/auth']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))
  
  // Storefront routes (public but need to check store exists)
  const isStorefrontRoute = pathname.startsWith('/store/')
  
  // Admin routes require super_admin role
  const isAdminRoute = pathname.startsWith('/admin')
  
  // Dashboard routes require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/products') ||
                          pathname.startsWith('/customers') ||
                          pathname.startsWith('/orders') ||
                          pathname.startsWith('/shipments') ||
                          pathname.startsWith('/finances') ||
                          pathname.startsWith('/settings')

  // Redirect unauthenticated users to login for protected routes
  if (!user && !isPublicRoute && !isStorefrontRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // For admin routes, we'll check the user's role in the actual page/component
  // since middleware can't easily access the database for role checks

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
