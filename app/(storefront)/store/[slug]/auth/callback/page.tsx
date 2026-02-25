'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Get the OAuth session from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          console.error('Error setting session:', sessionError)
          setError(sessionError.message)
          setLoading(false)
          return
        }

        // Get user data from search params
        const importerId = searchParams.get('importer_id')
        const name = searchParams.get('name')
        const phone = searchParams.get('phone')
        const address = searchParams.get('address')
        const city = searchParams.get('city')

        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user && importerId) {
          // Create or update store customer record
          const { error: customerError } = await supabase
            .from('store_customers')
            .upsert({
              importer_id: importerId,
              auth_id: user.id,
              email: user.email || '',
              name: name || user.email?.split('@')[0] || 'Customer',
              phone: phone || null,
              address: address || null,
              city: city || null,
            }, {
              onConflict: 'importer_id, email'
            })

          if (customerError) {
            console.error('Error creating customer:', customerError)
          }
        }

        // Store session in localStorage for easy access
        if (user) {
          const customerSession = {
            id: user.id,
            email: user.email,
            name: name || user.email?.split('@')[0] || 'Customer',
            importer_id: importerId,
          }
          localStorage.setItem(`customer_${slug}`, JSON.stringify(customerSession))
        }

        // Redirect to account page
        setTimeout(() => {
          router.push(`/store/${slug}/account`)
        }, 1500)
      } else {
        // No tokens in URL, check if already signed in
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push(`/store/${slug}/account`)
        } else {
          setError('Invalid authentication callback')
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err)
      setError('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-500">Verifying your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/store/${slug}/login`)}
            className="text-blue-600 hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-zinc-900 dark:text-white font-medium">Account verified successfully!</p>
        <p className="text-zinc-500 mt-2">Redirecting to your account...</p>
      </div>
    </div>
  )
}
