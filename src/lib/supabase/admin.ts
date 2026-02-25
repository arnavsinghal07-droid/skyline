import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses all RLS policies.
// ONLY use this in server-side API routes after verifying the caller's identity.
// NEVER import this from client-side code or expose the service key to the browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error(
      '[Sightline] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to .env.local — find it in Supabase → Project Settings → API.'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
