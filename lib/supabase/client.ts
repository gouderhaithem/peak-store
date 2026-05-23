import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// One client per browser tab. Calling createBrowserClient() multiple times
// would attach multiple GoTrueClient instances to the same localStorage
// key (`sb-<project>-auth-token`), which races on session refresh and can
// resolve the auth state to "no session" — manifesting as a blank admin
// page on hard reload. The "Multiple GoTrueClient instances detected"
// console warning is the canonical symptom.
let cached: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // Server-side renders shouldn't share a client across requests — return
  // a fresh one if there's no `window`. The cached path only kicks in on
  // the browser.
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    )
  }

  if (!cached) {
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    )
  }
  return cached
}
