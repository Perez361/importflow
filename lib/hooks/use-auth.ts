'use client'

import { createClient, resetClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types/database'

export interface AuthUser {
  auth: User | null
  profile: AppUser | null
}

// Get cached profile from sessionStorage
const getCachedProfile = (): AppUser | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = sessionStorage.getItem('userProfile')
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('Error reading cached profile:', e)
  }
  return null
}

// Clear cached profile
const clearCachedProfile = () => {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem('userProfile')
  } catch (e) {
    console.error('Error clearing cached profile:', e)
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser>({ auth: null, profile: null })
  const [loading, setLoading] = useState(true)
  
  // Get the singleton client
  const supabase = createClient()

  // Refresh user profile - useful when role changes in database
  const refreshProfile = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        // Update cache
        if (profile) {
          sessionStorage.setItem('userProfile', JSON.stringify(profile))
        }
        
        setUser(prev => ({ ...prev, profile }))
        return profile
      }
      return null
    } catch (error) {
      console.error('Error refreshing profile:', error)
      return null
    }
  }, [supabase])

  // Initialize auth state - only once on mount
  useEffect(() => {
    let isMounted = true
    
    const fetchProfile = async (userId: string): Promise<AppUser | null> => {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<{ data: AppUser | null, error: any }>((resolve) => 
          setTimeout(() => resolve({ data: null, error: null }), 5000)
        )
        
        // Race between the profile fetch and timeout
        const profilePromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
        
        const result = await Promise.race([profilePromise, timeoutPromise]) as any
        
        if (result?.data) {
          sessionStorage.setItem('userProfile', JSON.stringify(result.data))
          return result.data
        }
        
        // If timed out or error, try direct query
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (profile) {
          sessionStorage.setItem('userProfile', JSON.stringify(profile))
        }
        
        return profile
      } catch (error) {
        console.error('Profile fetch error:', error)
        return null
      }
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (session?.user) {
          // Try to get cached profile first
          const cachedProfile = getCachedProfile()
          
          if (cachedProfile) {
            setUser({ auth: session.user, profile: cachedProfile })
            setLoading(false)
            
            // Then fetch fresh profile in background
            fetchProfile(session.user.id).then(freshProfile => {
              if (isMounted && freshProfile) {
                setUser({ auth: session.user, profile: freshProfile })
              }
            })
          } else {
            const profile = await fetchProfile(session.user.id)
            if (isMounted) {
              setUser({ auth: session.user, profile })
              setLoading(false)
            }
          }
        } else {
          setUser({ auth: null, profile: null })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setUser({ auth: null, profile: null })
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          clearCachedProfile()
          setUser({ auth: null, profile: null })
          setLoading(false)
          return
        }
        
        // Handle sign in or initial session
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const cachedProfile = getCachedProfile()
          
          if (cachedProfile) {
            setUser({ auth: session.user, profile: cachedProfile })
            setLoading(false)
            
            // Fetch fresh in background
            fetchProfile(session.user.id).then(freshProfile => {
              if (isMounted && freshProfile) {
                setUser({ auth: session.user, profile: freshProfile })
              }
            })
          } else {
            const profile = await fetchProfile(session.user.id)
            if (isMounted) {
              setUser({ auth: session.user, profile })
              setLoading(false)
            }
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Sign up
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; business_name?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { data, error }
  }, [supabase])

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }, [supabase])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      // Get the user's role before clearing (for redirect decision)
      let userRole = null
      try {
        const storedProfile = sessionStorage.getItem('userProfile')
        if (storedProfile) {
          const profile = JSON.parse(storedProfile)
          userRole = profile.role
        }
      } catch (e) {
        // Ignore errors
      }

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signOut error:', error.message)
        return { error }
      }
      
      // Clear local state
      setUser({ auth: null, profile: null })
      // Clear cached profile
      clearCachedProfile()
      // Reset the client to clear any cached state
      resetClient()
      
      // Determine redirect based on user's role before sign out
      const redirectUrl = userRole === 'super_admin' ? '/admin/login' : '/login'
      
      // Use window.location for hard redirect to ensure clean state
      window.location.href = redirectUrl
      
      return { error: null }
    } catch (err) {
      console.error('Unexpected error during signOut:', err)
      // Force redirect anyway
      window.location.href = '/login'
      return { error: err as Error }
    }
  }, [supabase])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { data, error }
  }, [supabase])

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    return { data, error }
  }, [supabase])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<AppUser>) => {
    if (!user.auth) {
      return { data: null, error: new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.auth.id)
      .select()
      .single()

    if (!error && data) {
      // Update cache
      sessionStorage.setItem('userProfile', JSON.stringify(data))
      setUser(prev => ({ ...prev, profile: data }))
    }

    return { data, error }
  }, [supabase, user.auth])

  return {
    user,
    loading,
    isAuthenticated: !!user.auth,
    isSuperAdmin: user.profile?.role === 'super_admin',
    isImporter: user.profile?.role === 'importer',
    isStaff: user.profile?.role === 'staff',
    refreshProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }
}
