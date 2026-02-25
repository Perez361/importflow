'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()
  
  const [importerId, setImporterId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

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
      } catch (err) {
        console.error('Error fetching importer:', err)
        setError('Failed to load store')
      } finally {
        setLoading(false)
      }
    }

    fetchImporter()
  }, [slug, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const redirectUrl = `${window.location.origin}/store/${slug}/update-password`
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (resetError) {
        setError(resetError.message)
        setSubmitting(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error('Reset password error:', err)
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
            We have sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link 
            href={`/store/${slug}/login`}
            className="text-sm text-zinc-500 dark:text-zinc-400"
          >
            Back to <span className="text-blue-600 hover:underline">Sign in</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Link 
        href={`/store/${slug}/login`} 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        Back to Login
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6">
          Enter your email to receive a reset link
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}
