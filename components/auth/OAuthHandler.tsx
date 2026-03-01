'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'


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
    console.log('[OAuthHandler] Hash:', window.location.hash)
    console.log('[OAuthHandler] sessionStorage:', sessionStorage.getItem('oauth_slug'))
    console.log('[OAuthHandler] localStorage:', localStorage.getItem('oauth_slug'))
    
    if (code) {
      hasProcessedRef.current = true
      setIsProcessing(true)
      
      // Get slug from multiple sources (in order of priority):
      
      // 1. URL hash fragment - Supabase doesn't clear hash during OAuth redirect!
      let slug: string | null = null
      
      const hash = window.location.hash
      if (hash && hash.startsWith('#')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        slug = hashParams.get('slug')
        console.log('[OAuthHandler] Slug from hash:', slug)
      }
      
      // 2. sessionStorage - set by the login page before OAuth
      if (!slug) {
        slug = sessionStorage.getItem('oauth_slug')
        console.log('[OAuthHandler] Slug from sessionStorage:', slug)
      }
      
      // 3. localStorage - set by the login page before OAuth
      if (!slug) {
        slug = localStorage.getItem('oauth_slug')
        console.log('[OAuthHandler] Slug from localStorage:', slug)
      }
      
      // 4. query param (fallback)
      if (!slug) {
        slug = searchParams.get('slug')
        console.log('[OAuthHandler] Slug from query:', slug)
      }
      
      if (!slug) {
        console.error('[OAuthHandler] No slug found!')
        setError('Unable to determine which store to sign in to. Please try again.')
        setIsProcessing(false)
        return
      }
      
      // Handle the OAuth exchange
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
      
      // Clean up storage
      sessionStorage.removeItem('oauth_slug')
      localStorage.removeItem('oauth_slug')
      
      // Redirect to account page
      const redirectUrl = `/store/${slug}/account`
      console.log('[OAuthHandler] Redirecting to:', redirectUrl)
      router.push(`${redirectUrl}?success=true`)
      
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
