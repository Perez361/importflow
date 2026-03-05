'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function RootOAuthHandler() {
  const searchParams = useSearchParams()
  const [isPopup, setIsPopup] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if we're in a popup window
    const inPopup = window.opener !== null
    setIsPopup(inPopup)

    // Only handle if we're in a popup and have a code
    const code = searchParams.get('code')
    
    if (!inPopup || !code) {
      return
    }

    // We're in a popup with a code - handle OAuth
    handleOAuth(code)
  }, [searchParams])

  const handleOAuth = async (code: string) => {
    setStatus('loading')
    setMessage('Completing sign in...')

    try {
      const supabase = createClient()
      
      // Try to get the slug from localStorage
      const oauthSlug = localStorage.getItem('oauth_slug')
      
      if (!oauthSlug) {
        setStatus('error')
        setMessage('Store information not found. Please close this window and try again.')
        return
      }

      // Exchange code for session
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError || !sessionData.session) {
        setStatus('error')
        setMessage(exchangeError?.message || 'Failed to complete authentication.')
        return
      }

      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setStatus('error')
        setMessage('User not found after authentication.')
        return
      }

      // Get the importer (store) by slug
      const { data: importer, error: importerError } = await supabase
        .from('importers')
        .select('id')
        .eq('slug', oauthSlug)
        .single()

      if (importerError || !importer) {
        setStatus('error')
        setMessage('Store not found. Please try again.')
        return
      }

      // Create or update store customer record
      const { data: customer, error: customerError } = await supabase
        .from('store_customers')
        .upsert({
          importer_id: importer.id,
          auth_id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
          phone: user.user_metadata?.phone || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_active: true,
        }, {
          onConflict: 'importer_id, auth_id'
        })
        .select()
        .single()

      if (customerError) {
        setStatus('error')
        setMessage('Failed to create customer record.')
        return
      }

      // Prepare customer data
      const customerData = {
        id: customer?.id,
        auth_id: user.id,
        name: customer?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        email: customer?.email || user.email || '',
        phone: customer?.phone || user.user_metadata?.phone || null,
        address: customer?.address || null,
        city: customer?.city || null,
        importer_id: importer.id
      }

      // Clear the oauth_slug from localStorage
      localStorage.removeItem('oauth_slug')

      // Send message to parent window
      window.opener?.postMessage({
        type: 'OAUTH_SUCCESS',
        customerData,
        slug: oauthSlug
      }, window.location.origin)

      setStatus('success')
      setMessage('You have successfully signed in! You can now close this window.')
    } catch (err) {
      console.error('Root OAuth handler error:', err)
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
    }
  }

  // Only render if we're in a popup and handling OAuth
  if (!isPopup || status === 'idle') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Completing Sign In
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Sign In Successful!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {message}
            </p>
            <button
              onClick={() => window.close()}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Close Window & Continue
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Sign In Failed
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {message}
            </p>
            <button
              onClick={() => window.close()}
              className="w-full px-4 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  )
}
