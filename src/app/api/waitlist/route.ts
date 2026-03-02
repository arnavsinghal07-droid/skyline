import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWaitlistConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  let email: unknown
  try {
    const body = await request.json() as Record<string, unknown>
    email = body.email
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate email: must be a non-empty string containing '@'
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const admin = createAdminClient()

  const { error } = await admin
    .from('waitlist')
    .insert({ email: normalizedEmail })

  if (error && error.code !== '23505') {
    // 23505 = unique_violation (already on waitlist) — treat as success (idempotent)
    console.error('[Sightline] Failed to insert waitlist email:', error)
    return Response.json({ error: 'Failed to save email' }, { status: 500 })
  }

  // Fire-and-forget confirmation email — sendWaitlistConfirmationEmail logs errors without throwing
  sendWaitlistConfirmationEmail(normalizedEmail).catch((err) => {
    console.error('[Sightline] Waitlist email send failed (uncaught):', err)
  })

  return Response.json({ success: true })
}
