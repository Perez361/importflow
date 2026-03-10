'use client'

import { createClient, resetClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { StoreCustomer } from '@/types/database'

export interface StoreCustomerUser {
  auth: User | null
  profile: StoreCustomer | null
  importerId: string | null
  storeSlug: string | null
}

// Get cached customer from localStorage
const getCachedCustomer = (slug: string): StoreCustomerUser | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(`customer_${slug}`)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('Error reading cached customer:', e)
  }
  return null
}

// Clear cached customer
const clearCachedCustomer = (slug: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`customer_${slug}`)
  } catch (e) {
    console.error('Error clearing cached customer:', e)
  }
}

export function useStoreCustomerAuth(slug: string) {
  const [customer, setCustomer] = useState<StoreCustomerUser>({ 
    auth: null, 
    profile: null,
    importerId: null,
    storeSlug: slug
  })
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

  // Refresh customer profile
  const refreshProfile = useCallback(async () => {
    if (!supabase || !customer.auth) return null
    try {
      const { data: profile } = await supabase
        .from('store_customers')
        .select('*')
        .eq('auth_id', customer.auth.id)
        .single()
      
      if (profile) {
        localStorage.setItem(`customer_${slug}`, JSON.stringify({
          auth: customer.auth,
          profile,
          importerId: profile.importer_id,
          storeSlug: slug
        }))
      }
      
      return profile
    } catch (error) {
      console.error('Error refreshing customer profile:', error)
      return null
    }
  }, [supabase, customer.auth, slug])

  // Initialize auth state
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
          // Try to get cached customer first
          const cachedCustomer = getCachedCustomer(slug)
          
          if (cachedCustomer && cachedCustomer.auth?.id === session.user.id) {
            setCustomer(cachedCustomer)
            setLoading(false)
            
            // Fetch fresh profile in background
            const freshProfile = await supabase
              .from('store_customers')
              .select('*')
              .eq('auth_id', session.user.id)
              .single()
            
            if (isMounted && freshProfile.data) {
              const newCustomer = {
                auth: session.user,
                profile: freshProfile.data,
                importerId: freshProfile.data.importer_id,
                storeSlug: slug
              }
              setCustomer(newCustomer)
              localStorage.setItem(`customer_${slug}`, JSON.stringify(newCustomer))
            }
          } else {
            // Check if user is a store customer for this store
            const { data: profile } = await supabase
              .from('store_customers')
              .select('*')
              .eq('auth_id', session.user.id)
              .single()
            
            if (isMounted && profile) {
              const newCustomer = {
                auth: session.user,
                profile,
                importerId: profile.importer_id,
                storeSlug: slug
              }
              setCustomer(newCustomer)
              localStorage.setItem(`customer_${slug}`, JSON.stringify(newCustomer))
              setLoading(false)
            } else {
              // User is logged in but not a customer for this store
              setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
              setLoading(false)
            }
          }
        } else {
          setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing customer auth:', error)
        if (isMounted) {
          setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return
        
        if (event === 'SIGNED_OUT') {
          clearCachedCustomer(slug)
          setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
          setLoading(false)
          return
        }
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const cachedCustomer = getCachedCustomer(slug)
          
          if (cachedCustomer && cachedCustomer.auth?.id === session.user.id) {
            setCustomer(cachedCustomer)
            setLoading(false)
          } else {
            const { data: profile } = await supabase
              .from('store_customers')
              .select('*')
              .eq('auth_id', session.user.id)
              .single()
            
            if (isMounted && profile) {
              const newCustomer = {
                auth: session.user,
                profile,
                importerId: profile.importer_id,
                storeSlug: slug
              }
              setCustomer(newCustomer)
              localStorage.setItem(`customer_${slug}`, JSON.stringify(newCustomer))
              setLoading(false)
            } else {
              setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
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
  }, [supabase, slug])

  // Sign in as store customer
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { data, error }

    // Verify this user is a customer for this store
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('store_customers')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()
      
      if (profileError || !profile) {
        await supabase.auth.signOut()
        return { 
          data: null, 
          error: new Error('No account found for this store. Please register first.') 
        }
      }

      // Update last login
      await supabase
        .from('store_customers')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', profile.id)

      // Cache the customer
      const customerData = {
        auth: data.user,
        profile,
        importerId: profile.importer_id,
        storeSlug: slug
      }
      localStorage.setItem(`customer_${slug}`, JSON.stringify(customerData))
    }

    return { data, error }
  }, [supabase, slug])

  // Sign up as store customer
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    name: string,
    metadata?: { phone?: string; address?: string; city?: string }
  ) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          ...metadata,
        },
        emailRedirectTo: `${window.location.origin}/store/${slug}/auth/callback`,
      },
    })

    return { data, error }
  }, [supabase, slug])

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase) {
      clearCachedCustomer(slug)
      setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
      return { error: null }
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      
      clearCachedCustomer(slug)
      setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
      
      return { error }
    } catch (err) {
      console.error('Error during signOut:', err)
      clearCachedCustomer(slug)
      setCustomer({ auth: null, profile: null, importerId: null, storeSlug: slug })
      return { error: err as Error }
    }
  }, [supabase, slug])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<StoreCustomer>) => {
    if (!supabase || !customer.profile) {
      return { data: null, error: new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('store_customers')
      .update(updates)
      .eq('id', customer.profile.id)
      .select()
      .single()

    if (!error && data) {
      const newCustomer = {
        auth: customer.auth,
        profile: data,
        importerId: data.importer_id,
        storeSlug: slug
      }
      localStorage.setItem(`customer_${slug}`, JSON.stringify(newCustomer))
      setCustomer(newCustomer)
    }

    return { data, error }
  }, [supabase, customer.profile, customer.auth, slug])

  return {
    customer,
    loading,
    isAuthenticated: !!customer.auth,
    isActive: customer.profile?.is_active ?? true,
    isInitialized,
    refreshProfile,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }
}

