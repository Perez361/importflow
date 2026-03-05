'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'


export function OAuthHandler() {
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const code = searchParams.get('code')
    const currentPath = window.location.pathname
    
    console.log('[OAuthHandler] Code detected:', code ? 'YES' : 'NO')
    console.log('[OAuthHandler] Current path:', currentPath)
    
    // DISABLE OAuthHandler completely
    // Store OAuth is handled entirely by the server route at /store/{slug}/auth/callback
    // This handler was causing conflicts with the store OAuth flow
    // Always skip and return null
    console.log('[OAuthHandler] Skipping - OAuth handled by server route')
    return
  }, [searchParams])

  // Always return null - OAuth is handled by server-side routes
  return null
}

