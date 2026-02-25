import { createBrowserClient } from '@supabase/ssr'

// Type for the Supabase browser client - inferred from createBrowserClient return type
type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>

// Module-level client for caching
let cachedClient: SupabaseBrowserClient | null = null

/**
 * Creates a new Supabase client.
 * Uses a simple singleton pattern for the browser client.
 */
export function createClient(): SupabaseBrowserClient {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient
  }

  // Create new client
  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
