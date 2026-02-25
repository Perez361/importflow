'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { XCircle, RefreshCw, Mail, Loader2, CheckCircle } from 'lucide-react'

function AuthCodeErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'error' | 'success'>('checking')
  const [errorDescription, setErrorDescription] = useState<string | null>(null)

  useEffect(() => {
    const checkAndConfirm = async () => {
      const supabase = createClient()
      
      // Check for tokens in URL hash (from email confirmation link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      
      // Also check query params
      const queryAccessToken = searchParams.get('access_token')
      const queryRefreshToken = searchParams.get('refresh_token')
      const queryType = searchParams.get('type')
      
      const token = accessToken || queryAccessToken
      const refresh = refreshToken || queryRefreshToken
      const authType = type || queryType

      // If we have a token, try to confirm the email
      if (token) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refresh || '',
          })

          if (error) {
            console.error('Session error:', error)
            setStatus('error')
            setErrorDescription(error.message || 'Failed to confirm email.')
            return
          }

          if (data.user) {
            setStatus('success')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
            return
          }
        } catch (err) {
          console.error('Confirmation error:', err)
          setStatus('error')
          setErrorDescription('An unexpected error occurred.')
          return
        }
      }

      // No token found, show error
      setStatus('error')
      
      // Check for error details in URL
      const error = searchParams.get('error')
      const errorDescriptionParam = searchParams.get('error_description')
      
      if (errorDescriptionParam) {
        setErrorDescription(decodeURIComponent(errorDescriptionParam))
      } else if (error) {
        switch (error) {
          case 'access_denied':
            setErrorDescription('Access was denied. Please try again.')
            break
          case 'invalid_request':
            setErrorDescription('The request was invalid. Please try a different login method.')
            break
          case 'expired_token':
            setErrorDescription('The confirmation link has expired. Please request a new one.')
            break
          default:
            setErrorDescription('An authentication error occurred. Please try again.')
        }
      } else {
        setErrorDescription('No authentication token found. The link may have expired or already been used.')
      }
    }

    checkAndConfirm()
  }, [router, searchParams])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Verifying your account...
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Please wait while we process your confirmation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Email Confirmed!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your account has been verified. Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Authentication Error
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            {errorDescription || 'Something went wrong during authentication. The link may have expired or already been used.'}
          </p>
          
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Logging In
            </Link>
            
            <Link
              href="/register"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Create New Account
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            If you continue to have issues, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}

function Fallback() {
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

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AuthCodeErrorContent />
    </Suspense>
  )
}
