'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already authenticated and redirect accordingly
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User is already logged in, check their profile and redirect
          const { data: profile } = await supabase
            .from('users')
            .select('role, is_active')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            if (profile.role === 'super_admin') {
              // Redirect super admins to admin panel
              window.location.href = '/admin'
              return
            } else if (profile.is_active) {
              // Redirect importers/staff to dashboard
              window.location.href = '/dashboard'
              return
            } else {
              // Account is deactivated, sign them out
              await supabase.auth.signOut()
            }
          }
        }
      } catch (err) {
        console.error('Error checking auth:', err)
      } finally {
        setInitializing(false)
      }
    }
    
    checkAuth()
  }, [supabase])

  // Show loading while checking auth
  if (initializing) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mx-auto" />
            <div className="space-y-4">
              <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Login error:', signInError.message)
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data?.user) {
        // Fetch user profile from the users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If no profile or error, check if they might be a store customer
        if (profileError || !profile) {
          // Check if user exists in store_customers (they might be a customer trying to login here)
          const { data: customer } = await supabase
            .from('store_customers')
            .select('id, name, email, auth_id')
            .eq('auth_id', data.user.id)
            .maybeSingle()

          if (customer) {
            // This is a store customer trying to login to admin - deny access
            await supabase.auth.signOut()
            setError('Please use the storefront login page to access your customer account.')
            setLoading(false)
            return
          }

          // No profile found at all - deny access
          await supabase.auth.signOut()
          setError('Account not found. Please contact support.')
          setLoading(false)
          return
        }

        // Check if user is a super_admin - redirect to admin instead of dashboard
        if (profile.role === 'super_admin') {
          // Store profile in sessionStorage for immediate access after redirect
          sessionStorage.setItem('userProfile', JSON.stringify(profile))
          
          // Redirect to super admin panel
          setTimeout(() => {
            window.location.href = '/admin'
          }, 500)
          return
        }

        // Check if user is inactive
        if (!profile.is_active) {
          await supabase.auth.signOut()
          setError('Your account has been deactivated. Please contact support.')
          setLoading(false)
          return
        }

        // Store profile in sessionStorage for immediate access after redirect
        sessionStorage.setItem('userProfile', JSON.stringify(profile))
        console.log('Profile cached in sessionStorage, role:', profile.role)
        
        // Redirect to dashboard for importer/staff users
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-11 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-11 pr-12 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Remember me for 30 days
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
