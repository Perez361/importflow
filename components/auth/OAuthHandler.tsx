'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Cookie helper functions with enhanced settings for OAuth flow
function setCookie(name: string, value: string, maxAge: number = 600) {
  // Use SameSite=None and Secure for cross-site OAuth redirects
  // This allows the cookie to persist through the Google OAuth flow
  const isSecure = window.location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  const cookieString = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=None${secureFlag}`
  document.cookie = cookieString
  console.log(`[OAuthHandler] Set cookie ${name}:`, cookieString)
}

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=')
    if (cookieName === name) {
      console.log(`[OAuthHandler] Found cookie ${name}:`, decodeURIComponent(cookieValue))
      return decodeURIComponent(cookieValue)
    }
  }
  console.log(`[OAuthHandler] Cookie ${name} not found`)
  return null
}

function deleteCookie(name: string) {
  // Delete with SameSite=None to ensure it matches the original cookie
  const isSecure = window.location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  document.cookie = `${name}=; path=/; max-age=0; SameSite=None${secureFlag}`
  console.log(`[OAuthHandler] Deleted cookie ${name}`)
}


export function OAuthHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Prevent double processing
    if (hasProcessedRef.current) return
    
    const code = searchParams.get('code')
    console.log('[OAuthHandler] Code detected:', code ? 'YES' : 'NO')
    console.log('[OAuthHandler] Current URL:', window.location.href)
    console.log('[OAuthHandler] All cookies:', document.cookie)
    
    // Check if there's an error from a previous attempt
    const urlError = searchParams.get('error')
    if (urlError) {
      console.log('[OAuthHandler] Found error in URL:', urlError)
    }
    
    if (code) {
      hasProcessedRef.current = true
      setIsProcessing(true)
      
      // Get slug from various sources
      let slug = searchParams.get('slug')
      console.log('[OAuthHandler] Slug from URL:', slug)
      
      if (!slug) {
        slug = getCookie('oauth_slug')
        console.log('[OAuthHandler] Slug from cookie:', slug)
      }
      
      if (!slug) {
        slug = localStorage.getItem('oauth_slug')
        console.log('[OAuthHandler] Slug from localStorage:', slug)
      }
      
      // Clean up storage
      deleteCookie('oauth_slug')
      localStorage.removeItem('oauth_slug')
      sessionStorage.removeItem('oauth_slug')
      
      if (!slug) {
        console.error('[OAuthHandler] No slug found!')
        setError('Unable to determine which store to sign in to. Please try again.')
        setIsProcessing(false)
        return
      }
      
      // Handle the OAuth exchange directly
      handleOAuthExchange(code, slug)
    }
  }, [searchParams, router])

  async function handleOAuthExchange(code: string, slug: string) {
    try {
      console.log('[OAuthHandler] Starting OAuth exchange for slug:', slug)
      
      const supabase = createClient()
      
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('[OAuthHandler] Error exchanging code:', exchangeError)
        setError('Failed to complete sign in. Please try again.')
        setIsProcessing(false)
        return
      }
      
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('[OAuthHandler] No user found after exchange')
        setError('Authentication failed. Please try again.')
        setIsProcessing(false)
        return
      }
      
      console.log('[OAuthHandler] User authenticated:', user.email)
      
      // Get the importer (store) by slug
      const { data: importer, error: importerError } = await supabase
        .from('importers')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (importerError || !importer) {
        console.error('[OAuthHandler] Importer not found:', importerError)
        setError('Store not found. Please try again.')
        setIsProcessing(false)
        return
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
        console.error('[OAuthHandler] Error creating customer:', customerError)
        // Continue anyway, as the user is authenticated
      }
      
      // Store customer session in localStorage
      const { data: customer } = await supabase
        .from('store_customers')
        .select('*')
        .eq('auth_id', user.id)
        .eq('importer_id', importer.id)
        .single()
      
      if (customer) {
        const customerSession = {
          id: customer.id,
          auth_id: customer.auth_id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          importer_id: customer.importer_id
        }
        localStorage.setItem(`customer_${slug}`, JSON.stringify(customerSession))
      }
      
      console.log('[OAuthHandler] Redirecting to account page...')
      
      // Redirect to account page
      router.push(`/store/${slug}/account?success=true`)
      
    } catch (err) {
      console.error('[OAuthHandler] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background fixed inset-0 z-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background fixed inset-0 z-50 p-4">
        <div className="bg-card rounded-xl p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sign In Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Export cookie helpers for use in login/register pages
export { setCookie, getCookie, deleteCookie }
