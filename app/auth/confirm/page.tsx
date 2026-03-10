'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      
      // Get the hash fragment from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      
      // Also check query params (some flows use these)
      const queryAccessToken = searchParams.get('access_token')
      const queryRefreshToken = searchParams.get('refresh_token')
      const queryType = searchParams.get('type')
      
      const token = accessToken || queryAccessToken
      const refresh = refreshToken || queryRefreshToken
      const authType = type || queryType

      if (!token) {
        setStatus('error')
        setErrorMessage('No authentication token found. Please try clicking the confirmation link again.')
        return
      }

      try {
        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refresh || '',
        })

        if (error) {
          console.error('Session error:', error)
          setStatus('error')
          setErrorMessage(error.message || 'Failed to confirm email. The link may have expired.')
          return
        }

        if (data.user) {
          const user = data.user
          console.log('[Confirm] User confirmed:', user.email)
          console.log('[Confirm] User metadata:', user.user_metadata)
          
          // Check if this is a storefront registration by looking at user metadata
          const storeSlug = user.user_metadata?.store_slug
          const isStorefrontCustomer = user.user_metadata?.is_storefront_customer
          const importerId = user.user_metadata?.importer_id
          
          if (storeSlug && isStorefrontCustomer) {
            // This is a storefront customer - handle storefront-specific setup
            console.log('[Confirm] Storefront customer detected, slug:', storeSlug)
            
            // Get the importer (store) by slug
            const { data: importer, error: importerError } = await supabase
              .from('importers')
              .select('id')
              .eq('slug', storeSlug)
              .eq('is_active', true)
              .single()

            if (importerError || !importer) {
              console.error('[Confirm] Importer not found for slug:', storeSlug, importerError)
              // Still allow login but as unverified
              setStatus('error')
              setErrorMessage('Store not found. Please contact support.')
              return
            }

            console.log('[Confirm] Importer found:', importer.id)

            // Create store_customers record
            const { data: customer, error: customerError } = await supabase
              .from('store_customers')
              .upsert({
                importer_id: importer.id,
                auth_id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
                phone: user.user_metadata?.phone || null,
                address: user.user_metadata?.address || null,
                city: user.user_metadata?.city || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                password_hash: null,
                is_active: true,
              }, {
                onConflict: 'importer_id, auth_id'
              })
              .select()
              .single()

            if (customerError) {
              console.error('[Confirm] Error creating store customer:', customerError)
              // Continue anyway - we'll try to create user record
            }

            console.log('[Confirm] Store customer created/updated:', customer?.id)

            // Create/update users table with 'customer' role
            const { data: existingUser } = await supabase
              .from('users')
              .select('id, role')
              .eq('id', user.id)
              .single()

            if (existingUser) {
              // User exists - update to customer role if not already importer/super_admin
              if (existingUser.role !== 'importer' && existingUser.role !== 'super_admin') {
                await supabase
                  .from('users')
                  .update({ role: 'customer' })
                  .eq('id', user.id)
                console.log('[Confirm] Updated user role to customer')
              }
            } else {
              // Create new user with customer role
              await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
                  role: 'customer',
                  is_active: true,
                })
              console.log('[Confirm] Created user with customer role')
            }

            // Sign out the Supabase session - customer will use localStorage
            await supabase.auth.signOut()
            console.log('[Confirm] Signed out - storefront customer will use localStorage')

            // Redirect to storefront login with success
            setStatus('success')
            setTimeout(() => {
              router.push(`/store/${storeSlug}/login?confirmed=true`)
            }, 1500)
            return
          }

          // Non-storefront user - original flow
          setStatus('success')
          
          // Redirect to dashboard or the intended page
          const next = searchParams.get('next') || '/dashboard'
          
          setTimeout(() => {
            router.push(next)
          }, 1500)
        } else {
          setStatus('error')
          setErrorMessage('Failed to confirm email. Please try again.')
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        setStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    }

    confirmEmail()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Confirming your email...
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Please wait while we verify your account.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Your account has been verified. You can now sign in.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Confirmation Failed
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Loading...
          </h2>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmFallback />}>
      <ConfirmContent />
    </Suspense>
  )
}
