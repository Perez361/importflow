'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

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
    <div className="card p-8 shadow-soft-xl animate-scale-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground mt-2">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email" className="label">
            Email address
          </label>
          <div className="relative">
            <Mail className="input-icon" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input-with-icon"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="input-icon" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="input-with-icon pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0"
            />
            <span className="text-sm text-muted-foreground">
              Remember me for 30 days
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full group"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="divider my-6" />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="card p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
