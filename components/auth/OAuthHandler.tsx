'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

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
  const [isRedirecting, setIsRedirecting] = useState(false)
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
    
    if (code) {
      hasProcessedRef.current = true
      setIsRedirecting(true)
      
      // Get slug from URL first
      let slug = searchParams.get('slug')
      console.log('[OAuthHandler] Slug from URL:', slug)
      
      // If no slug in URL, try to get from cookie
      if (!slug) {
        slug = getCookie('oauth_slug')
        console.log('[OAuthHandler] Slug from cookie:', slug)
      }
      
      // Also try localStorage as last resort
      if (!slug) {
        slug = localStorage.getItem('oauth_slug')
        console.log('[OAuthHandler] Slug from localStorage:', slug)
      }
      
      // Clean up all storage
      deleteCookie('oauth_slug')
      localStorage.removeItem('oauth_slug')
      sessionStorage.removeItem('oauth_slug')
      
      // Build the final URL
      let finalUrl = '/auth/callback'
      
      if (slug) {
        finalUrl += `?slug=${encodeURIComponent(slug)}`
        if (code) {
          finalUrl += `&code=${code}`
        }
      } else if (code) {
        finalUrl += `?code=${code}`
      }
      
      // Add any other params from current URL
      const currentParams = new URLSearchParams(window.location.search)
      for (const [key, value] of currentParams.entries()) {
        if (key !== 'slug' && key !== 'code') {
          finalUrl += finalUrl.includes('?') ? '&' : '?'
          finalUrl += `${key}=${encodeURIComponent(value)}`
        }
      }
      
      console.log('[OAuthHandler] Final redirect URL:', finalUrl)
      
      // Use window.location for a full redirect to ensure cookies are properly sent
      window.location.href = finalUrl
    }
  }, [searchParams])

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
