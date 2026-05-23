/**
 * Anonymous Supabase client for public catalog reads.
 *
 * Why this exists separately from `server.ts` and `client.ts`:
 *   - `server.ts` imports `next/headers`, which is server-only. Importing it
 *     transitively from a Client Component bundle is a hard error.
 *   - `client.ts` uses `createBrowserClient`, which expects to run in the
 *     browser with `document.cookie` access.
 *
 * Most product reads are public (RLS allows anonymous SELECT on active
 * products / wilayas / colors), so they don't need a session at all. This
 * file provides one bare client that the repository layer can use from
 * either a Server Component or a Client Component without dragging
 * server-only imports into the browser bundle.
 *
 * Note: this client has NO auth context. Admin-gated reads (e.g. listing
 * inactive products) need to use the server client instead, because RLS
 * uses `is_admin()` which depends on `auth.uid()`.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function getPublicClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )
  }
  return cached
}
