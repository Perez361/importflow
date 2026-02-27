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
      // Redirect to auth callback with all query params
      const callbackUrl = `/auth/callback${window.location.search}`
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
