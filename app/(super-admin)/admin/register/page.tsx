'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle, Shield } from 'lucide-react'

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
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setGoogleLoading(true)
    
    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (googleError) {
        console.error('Google signup error:', googleError.message)
        setError(googleError.message)
        setGoogleLoading(false)
        return
      }

      if (data?.url) {
        // Redirect to Google OAuth
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred during Google signup')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'super_admin', // Set the role in metadata
          },
          emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Failed to create account')
        setLoading(false)
        return
      }

      // Create the user profile with super_admin role
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: 'super_admin',
          is_active: true,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // If profile creation fails, we still have the auth user
        // but we should inform the user
        setError('Account created but profile setup failed. Please contact support.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card p-8 shadow-soft-xl animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Check your email
          </h2>
          <p className="text-muted-foreground mb-6">
            We've sent a confirmation link to <span className="font-medium text-foreground">{formData.email}</span>
          </p>
          <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account. After verification, you'll be able to access the super admin dashboard.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-8 shadow-soft-xl animate-scale-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Super Admin Registration
        </h2>
        <p className="text-muted-foreground mt-2">
          Create your super admin account
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
          <label htmlFor="fullName" className="label">
            Full name
          </label>
          <div className="relative">
            <User className="input-icon" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Admin Name"
              required
              className="input-with-icon"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="label">
            Email address
          </label>
          <div className="relative">
            <Mail className="input-icon" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
              className="input-with-icon"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <Lock className="input-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
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
          <p className="form-hint">
            Must be at least 6 characters
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="input-icon" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="input-with-icon"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors">
            Privacy Policy
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full group"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Admin Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="divider my-6" />

      <div className="text-center">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>
      </div>

      <div className="divider my-6" />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an admin account?{' '}
          <Link
            href="/admin/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
