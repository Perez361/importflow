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
          // Fetch user profile to verify super admin role
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single()
          
          setStatus('success')
          
          // Redirect to admin dashboard if super admin, otherwise to regular dashboard
          const redirectPath = profile?.role === 'super_admin' ? '/admin' : '/dashboard'
          
          setTimeout(() => {
            router.push(redirectPath)
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
              Email Confirmed!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your account has been verified. Redirecting you to the admin dashboard...
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
              onClick={() => router.push('/admin/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Admin Login
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
