'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Cookie helper functions
function setCookie(name: string, value: string, maxAge: number = 300) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

export function OAuthHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const code = searchParams.get('code')
    if (code && !isRedirecting) {
      setIsRedirecting(true)
      
      // Get slug from URL or cookie
      let slug = searchParams.get('slug')
      
      // If no slug in URL, try to get from cookie
      if (!slug) {
        slug = getCookie('oauth_slug')
        console.log('Retrieved slug from cookie:', slug)
      }
      
      // Clean up the cookie
      deleteCookie('oauth_slug')
      
      // Build the full query string preserving all params
      const queryString = window.location.search
      const hash = window.location.hash
      
      // If we have a slug from cookie but not in URL, add it
      let finalQueryString = queryString
      if (slug && !queryString.includes('slug=')) {
        const separator = queryString ? '&' : '?'
        finalQueryString = `${queryString}${separator}slug=${encodeURIComponent(slug)}`
      }
      
      // Redirect to auth callback with all query params and hash
      const callbackUrl = `/auth/callback${finalQueryString}${hash}`
      
      console.log('OAuth redirect:', callbackUrl)
      router.replace(callbackUrl)
    }
  }, [searchParams, router, isRedirecting])

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background fixed inset-0 z-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    )
  }

  return null
}

// Export cookie helpers for use in login/register pages
export { setCookie, getCookie, deleteCookie }
