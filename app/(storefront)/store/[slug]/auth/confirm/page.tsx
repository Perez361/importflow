'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function StoreConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const slug = params.slug as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      
      // Supabase sends tokens in the URL hash fragment after confirmation
      // Format: #access_token=xxx&refresh_token=xxx&type=xxx
      const hash = window.location.hash
      const search = window.location.search
      
      console.log('[Store Confirm] Full URL:', window.location.href)
      console.log('[Store Confirm] Hash:', hash)
      console.log('[Store Confirm] Search:', search)
      
      // Parse from hash first (Supabase default)
      let hashParams = new URLSearchParams(hash.substring(1))
      let accessToken = hashParams.get('access_token')
      let refreshToken = hashParams.get('refresh_token')
      
      // If not in hash, try query params
      if (!accessToken) {
        const queryParams = new URLSearchParams(search)
        accessToken = queryParams.get('access_token')
        refreshToken = queryParams.get('refresh_token')
      }

      console.log('[Store Confirm] Access token found:', !!accessToken)

      if (!accessToken) {
        setStatus('error')
        setErrorMessage('No authentication token found. Please try clicking the confirmation link again.')
        return
      }

      try {
        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error('[Store Confirm] Session error:', error)
          setStatus('error')
          setErrorMessage(error.message || 'Failed to confirm email. The link may have expired.')
          return
        }

        if (data.user) {
          const user = data.user
          console.log('[Store Confirm] User confirmed:', user.email)
          console.log('[Store Confirm] User metadata:', user.user_metadata)
          
          // Get the importer (store) by slug
          const { data: importer, error: importerError } = await supabase
            .from('importers')
            .select('id')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

          if (importerError || !importer) {
            console.error('[Store Confirm] Importer not found for slug:', slug, importerError)
            setStatus('error')
            setErrorMessage('Store not found. Please contact support.')
            return
          }

          console.log('[Store Confirm] Importer found:', importer.id)

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
            console.error('[Store Confirm] Error creating store customer:', customerError)
            // Try to fetch existing customer
            const { data: existingCustomer } = await supabase
              .from('store_customers')
              .select('*')
              .eq('importer_id', importer.id)
              .eq('auth_id', user.id)
              .single()
              
            if (!existingCustomer) {
              setStatus('error')
              setErrorMessage('Failed to create customer account. Please contact support.')
              return
            }
          }

          console.log('[Store Confirm] Store customer created/updated:', customer?.id)

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
              console.log('[Store Confirm] Updated user role to customer')
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
            console.log('[Store Confirm] Created user with customer role')
          }

          // Sign out the Supabase session - customer will use localStorage
          await supabase.auth.signOut()
          console.log('[Store Confirm] Signed out - storefront customer will use localStorage')

          // Redirect to storefront login with success
          setStatus('success')
          setTimeout(() => {
            router.push(`/store/${slug}/login?confirmed=true`)
          }, 1500)
          return
        } else {
          setStatus('error')
          setErrorMessage('Failed to confirm email. Please try again.')
        }
      } catch (err) {
        console.error('[Store Confirm] Confirmation error:', err)
        setStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    }

    confirmEmail()
  }, [router, searchParams, slug])

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
              Email Confirmed!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your account has been verified. Redirecting you to login...
            </p>
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
              onClick={() => router.push(`/store/${slug}/login`)}
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

function StoreConfirmFallback() {
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

export default function StoreConfirmPage() {
  return (
    <Suspense fallback={<StoreConfirmFallback />}>
      <StoreConfirmContent />
    </Suspense>
  )
}

