'use client'

import { createClient, resetClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types/database'

export interface AuthUser {
  auth: User | null
  profile: AppUser | null
  userType: 'super_admin' | 'importer_staff' | 'store_customer' | null
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

// Determine user type based on profile
const getUserType = (profile: AppUser | null): AuthUser['userType'] => {
  if (!profile) return null
  if (profile.role === 'super_admin') return 'super_admin'
  if (profile.role === 'importer' || profile.role === 'staff') return 'importer_staff'
  return null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser>({ auth: null, profile: null, userType: null })
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const initializationComplete = useRef(false)
  
  // Initialize client only on client side
  useEffect(() => {
    supabaseRef.current = createClient()
  }, [])

  // Get the singleton client (may be null on server)
  const supabase = supabaseRef.current

  // Refresh user profile - useful when role changes in database
  const refreshProfile = useCallback(async () => {
    if (!supabase) return null
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          sessionStorage.setItem('userProfile', JSON.stringify(profile))
          setUser({ 
            auth: authUser, 
            profile, 
            userType: getUserType(profile) 
          })
        }
        
        return profile
      }
      return null
    } catch (error) {
      console.error('Error refreshing profile:', error)
      return null
    }
  }, [supabase])

  // Fetch profile for importer staff/super admin
  const fetchImporterProfile = useCallback(async (userId: string): Promise<AppUser | null> => {
    if (!supabase) return null
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profile && !error) {
        sessionStorage.setItem('userProfile', JSON.stringify(profile))
        return profile
      }
      return null
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }, [supabase])

  // Initialize auth state - only once on mount
  useEffect(() => {
    if (!supabase || initializationComplete.current) {
      if (!supabase) setLoading(false)
      return
    }
    
    initializationComplete.current = true
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (session?.user) {
          // Try to get cached profile first
          const cachedProfile = getCachedProfile()
          
          if (cachedProfile) {
            setUser({ 
              auth: session.user, 
              profile: cachedProfile, 
              userType: getUserType(cachedProfile) 
            })
            setLoading(false)
            
            // Fetch fresh profile in background to verify
            const freshProfile = await fetchImporterProfile(session.user.id)
            if (isMounted && freshProfile) {
              setUser({ 
                auth: session.user, 
                profile: freshProfile, 
                userType: getUserType(freshProfile) 
              })
            }
          } else {
            const profile = await fetchImporterProfile(session.user.id)
            if (isMounted) {
              setUser({ 
                auth: session.user, 
                profile, 
                userType: getUserType(profile) 
              })
              setLoading(false)
            }
          }
        } else {
          setUser({ auth: null, profile: null, userType: null })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setUser({ auth: null, profile: null, userType: null })
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
          setUser({ auth: null, profile: null, userType: null })
          setLoading(false)
          return
        }
        
        // Handle sign in or initial session
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const cachedProfile = getCachedProfile()
          
          if (cachedProfile) {
            setUser({ 
              auth: session.user, 
              profile: cachedProfile, 
              userType: getUserType(cachedProfile) 
            })
            setLoading(false)
            
            // Fetch fresh in background
            const freshProfile = await fetchImporterProfile(session.user.id)
            if (isMounted && freshProfile) {
              setUser({ 
                auth: session.user, 
                profile: freshProfile, 
                userType: getUserType(freshProfile) 
              })
            }
          } else {
            const profile = await fetchImporterProfile(session.user.id)
            if (isMounted) {
              setUser({ 
                auth: session.user, 
                profile, 
                userType: getUserType(profile) 
              })
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
  }, [supabase, fetchImporterProfile])

  // Sign up
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; business_name?: string; role?: string }
  ) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
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
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }, [supabase])

  // Sign out - properly clears all state
  const signOut = useCallback(async () => {
    if (!supabase) {
      // Even without supabase, clear local state and redirect
      clearCachedProfile()
      setUser({ auth: null, profile: null, userType: null })
      window.location.href = '/login'
      return { error: null }
    }
    
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
      }
      
      // Always clear local state regardless of auth signOut result
      setUser({ auth: null, profile: null, userType: null })
      clearCachedProfile()
      resetClient()
      
      // Determine redirect based on user's role before sign out
      let redirectUrl = '/login'
      if (userRole === 'super_admin') {
        redirectUrl = '/admin/login'
      } else if (userRole === 'importer' || userRole === 'staff') {
        redirectUrl = '/login'
      }
      
      // Use window.location for hard redirect to ensure clean state
      window.location.href = redirectUrl
      
      return { error: null }
    } catch (err) {
      console.error('Unexpected error during signOut:', err)
      // Force redirect anyway
      clearCachedProfile()
      setUser({ auth: null, profile: null, userType: null })
      window.location.href = '/login'
      return { error: err as Error }
    }
  }, [supabase])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { data, error }
  }, [supabase])

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    return { data, error }
  }, [supabase])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<AppUser>) => {
    if (!supabase || !user.auth) {
      return { data: null, error: new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.auth.id)
      .select()
      .single()

    if (!error && data) {
      sessionStorage.setItem('userProfile', JSON.stringify(data))
      setUser(prev => ({ 
        ...prev, 
        profile: data,
        userType: getUserType(data)
      }))
    }

    return { data, error }
  }, [supabase, user.auth])

  return {
    user,
    loading,
    isAuthenticated: !!user.auth,
    isSuperAdmin: user.userType === 'super_admin',
    isImporterStaff: user.userType === 'importer_staff',
    isStoreCustomer: user.userType === 'store_customer',
    isInitialized,
    refreshProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }
}

