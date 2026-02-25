import { createBrowserClient } from '@supabase/ssr'

// Type for the Supabase browser client - inferred from createBrowserClient return type
type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>

// Module-level client for caching - only initialized in browser
let cachedClient: SupabaseBrowserClient | null = null

/**
 * Creates a new Supabase client.
 * Uses a simple singleton pattern for the browser client.
 * Returns null if environment variables are not available or if called on server.
 */
export function createClient(): SupabaseBrowserClient | null {
  // Prevent client creation during SSR/build time
  if (typeof window === 'undefined') {
    return null
  }

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  // Return cached client if available
  if (cachedClient) {
    return cachedClient
  }

  // Create new client
  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return cachedClient
}

/**
 * Reset client state - useful after logout
 * This ensures no stale state is retained
 */
export function resetClient(): void {
  cachedClient = null
}

/**
 * Force refresh the client - useful when session changes
 */
export function forceRefreshClient(): void {
  cachedClient = null
}
