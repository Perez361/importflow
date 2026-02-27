'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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
      
      // Get slug from URL or sessionStorage
      let slug = searchParams.get('slug')
      
      // If no slug in URL, try to get from sessionStorage
      if (!slug) {
        slug = sessionStorage.getItem('oauth_slug')
        console.log('Retrieved slug from sessionStorage:', slug)
      }
      
      // Build the full query string preserving all params
      const queryString = window.location.search
      const hash = window.location.hash
      
      // If we have a slug from sessionStorage but not in URL, add it
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
