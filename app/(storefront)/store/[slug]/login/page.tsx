'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { setCookie } from '@/components/auth/OAuthHandler'


// Google OAuth icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function StoreLoginContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importerName, setImporterName] = useState<string>('')
  const [importerId, setImporterId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    fetchImporter()
  }, [slug])

  const fetchImporter = async () => {
    try {
      const { data, error } = await supabase
        .from('importers')
        .select('id, business_name')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setError('Store not found')
        return
      }

      setImporterName(data.business_name)
      setImporterId(data.id)
    } catch (err) {
      console.error('Error fetching importer:', err)
      setError('Failed to load store')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    
    try {
      // Store slug in multiple places for maximum reliability
      // Enhanced cookies with SameSite=None for cross-site OAuth flow
      console.log('[Login] Storing slug for OAuth:', slug)
      setCookie('oauth_slug', slug, 600) // 10 minutes expiry
      // localStorage as backup
      localStorage.setItem('oauth_slug', slug)
      sessionStorage.setItem('oauth_slug', slug)
      console.log('[Login] Stored slug in cookie, localStorage, and sessionStorage')
      
      // Use the root callback URL - OAuthHandler will process it
      const redirectUrl = `${window.location.origin}/?slug=${slug}`
      console.log('[Login] Redirect URL for Google OAuth:', redirectUrl)
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (oauthError) {
        console.error('[Login] Google OAuth error:', oauthError.message)
        setError('Failed to sign in with Google. Please try again.')
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('[Login] Google OAuth error:', err)
      setError('An unexpected error occurred with Google sign-in.')
      setGoogleLoading(false)
    }
  }





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password')
        } else {
          setError(authError.message)
        }
        setSubmitting(false)
        return
      }

      if (data.user) {
        // Check if user is an importer/staff member - not allowed in storefront
        const { data: staffUser } = await supabase
          .from('users')
          .select('id, email, role, importer_id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (staffUser) {
          await supabase.auth.signOut()
          setError('Staff members cannot access the storefront. Please use the dashboard login.')
          setSubmitting(false)
          return
        }

        // Check if customer exists for this importer
        const { data: customer, error: customerError } = await supabase
          .from('store_customers')
          .select('*')
          .eq('auth_id', data.user.id)
          .eq('importer_id', importerId)
          .single()

        if (customerError || !customer) {
          await supabase.auth.signOut()
          setError('No account found for this store. Please register first.')
          setSubmitting(false)
          return
        }

        if (!customer.is_active) {
          await supabase.auth.signOut()
          setError('Your account has been deactivated. Please contact the store.')
          setSubmitting(false)
          return
        }

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
        
        const redirectTo = searchParams.get('redirect') || `/store/${slug}/account`
        window.location.href = redirectTo
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error && !importerId) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Link
        href={`/store/${slug}`}
        className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6"
      >
        Back to Store
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Sign in to {importerName}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Google OAuth Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {googleLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-zinc-600 border-t-transparent rounded-full"></div>
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}
            <span className="text-zinc-700 dark:text-zinc-200 font-medium">
              Continue with Google
            </span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No account?{' '}
            <Link href={`/store/${slug}/register`} className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Fallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  )
}

export default function StoreLoginPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <StoreLoginContent />
    </Suspense>
  )
}
