import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Session-refresh helper for the Next 16 proxy.
//
// We do NOT redirect unauthenticated users here — Peak Store is a public
// storefront. Auth gating for /admin lives in the admin layout, which can
// also check the user's role. This proxy's only job is to keep the auth
// cookies fresh on every request so server components see a valid session.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // With Fluid compute, don't put this client in a module-scope variable.
  // Always construct a new one per request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: do not put any code between createServerClient and
  // supabase.auth.getClaims(). Removing this call or wrapping it in
  // conditionals can cause users to be randomly logged out under SSR.
  await supabase.auth.getClaims()

  // IMPORTANT: return the supabaseResponse object as-is. If you need a
  // different response, copy its cookies onto the new one.
  return supabaseResponse
}
