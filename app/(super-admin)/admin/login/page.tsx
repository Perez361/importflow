'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'

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

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback`,
        },
      })

      if (oauthError) {
        console.error('Google OAuth error:', oauthError.message)
        setError('Failed to sign in with Google. Please try again.')
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('Google OAuth error:', err)
      setError('An unexpected error occurred with Google sign-in.')
      setGoogleLoading(false)
    }
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

        // If no profile, deny access
        if (profileError || !profile) {
          await supabase.auth.signOut()
          setError('Account not found. Please contact support.')
          setLoading(false)
          return
        }

        // Check if user is a super_admin - only allow super admins
        if (profile.role !== 'super_admin') {
          await supabase.auth.signOut()
          setError('You do not have super admin access. Please use the regular login.')
          setLoading(false)
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
        console.log('Super Admin profile cached in sessionStorage')
        
        // Redirect to super admin dashboard
        setTimeout(() => {
          window.location.href = '/admin'
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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Super Admin Login
        </h2>
        <p className="text-muted-foreground mt-2">
          Sign in to access the admin dashboard
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
              placeholder="admin@example.com"
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
              href="/admin/forgot-password"
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
              Sign in to Admin
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
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

      <div className="divider my-6" />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an admin account?{' '}
          <Link
            href="/admin/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Request access
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
