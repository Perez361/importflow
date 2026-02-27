'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

export default function RegisterPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const supabase = createClient()
  
  const [importerId, setImporterId] = useState<string>('')
  const [importerName, setImporterName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: ''
  })

  // Check for confirmation in URL
  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    const email = searchParams.get('email')
    if (confirmed === 'true' && email) {
      setConfirmedEmail(email)
      setSuccess(true)
    }
  }, [searchParams])

  // Fetch importer info
  useEffect(() => {
    async function fetchImporter() {
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

        setImporterId(data.id)
        setImporterName(data.business_name)
      } catch (err) {
        console.error('Error fetching importer:', err)
        setError('Failed to load store')
      } finally {
        setLoading(false)
      }
    }

    fetchImporter()
  }, [slug, supabase])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  // Handle Google OAuth sign-up
  const handleGoogleSignUp = async () => {
    setError(null)
    setGoogleLoading(true)
    
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?slug=${slug}`,
        },
      })

      if (oauthError) {
        console.error('Google OAuth error:', oauthError.message)
        setError('Failed to sign up with Google. Please try again.')
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('Google OAuth error:', err)
      setError('An unexpected error occurred with Google sign-up.')
      setGoogleLoading(false)
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      // Register using Supabase Auth
      const redirectUrl = `${window.location.origin}/store/${slug}/auth/callback`
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone || null,
            address: formData.address || null,
            city: formData.city || null,
            importer_id: importerId,
          },
          emailRedirectTo: redirectUrl,
        },
      })

      if (authError) {
        console.error('Registration error:', authError)
        
        if (authError.message.includes('already been registered')) {
          setError('An account with this email already exists. Please sign in or reset your password.')
        } else {
          setError(authError.message)
        }
        setSubmitting(false)
        return
      }

      // Show success message
      setSuccess(true)
      setConfirmedEmail(formData.email)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        city: ''
      })
    } catch (err) {
      console.error('Registration error:', err)
      setError('An error occurred. Please try again.')
    } finally {
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

  // Success - email verification sent
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Check Your Email!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            We have sent a verification link to <strong>{confirmedEmail}</strong>. 
            Click the link in the email to verify your account.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Did not receive the email? Check your spam folder.
            </p>
          </div>

          <Link 
            href={`/store/${slug}/login`}
            className="text-sm text-zinc-500 dark:text-zinc-400"
          >
            Already verified? <span className="text-blue-600 hover:underline">Sign in</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Link 
        href={`/store/${slug}`} 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        Back to Store
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6">
          Register for {importerName}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
            <input 
              id="name"
              name="name"
              type="text" 
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
            <input 
              id="email"
              name="email"
              type="email" 
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone (optional)</label>
            <input 
              id="phone"
              name="phone"
              type="tel" 
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">Address (optional)</label>
            <input 
              id="address"
              name="address"
              type="text" 
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-2">City (optional)</label>
            <input 
              id="city"
              name="city"
              type="text" 
              placeholder="New York"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Google OAuth Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
        
        <p className="mt-6 text-center text-zinc-500 dark:text-zinc-400">
          Already have an account? 
          <Link href={`/store/${slug}/login`} className="text-blue-600 hover:underline ml-1">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
