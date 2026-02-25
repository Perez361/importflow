'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function StoreLoginContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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
