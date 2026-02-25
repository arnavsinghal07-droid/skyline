import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type DbUserRole = 'admin' | 'pm' | 'viewer'

const ROLE_MAP: Record<string, DbUserRole> = {
  Founder:  'admin',
  PM:       'pm',
  Engineer: 'viewer',
  Other:    'viewer',
}

export async function POST(request: NextRequest) {
  // ── 1. Verify auth ───────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── 2. Idempotency — skip silently if user already has a profile ──────────
  const { data: existingProfile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json({ org_id: existingProfile.org_id, alreadyOnboarded: true })
  }

  // ── 3. Parse and validate body ───────────────────────────────────────────
  let companyName: string
  let productName: string
  let productDescription: string
  let role: string

  try {
    const body = await request.json()
    companyName       = (body.companyName       ?? '').trim()
    productName       = (body.productName       ?? '').trim()
    productDescription = (body.productDescription ?? '').trim()
    role              = body.role ?? 'Other'

    if (!companyName || !productName) {
      return NextResponse.json(
        { error: 'companyName and productName are required' },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── 4–6 use the service-role client so RLS is bypassed for the bootstrap ──
  // organizations has no INSERT RLS policy by design — see migration comment.
  const admin = createAdminClient()

  // ── 4. Create organisation ───────────────────────────────────────────────
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: companyName, plan: 'free' })
    .select('id')
    .single()

  if (orgError || !org) {
    console.error('[Sightline] Onboard — org insert error:', orgError)
    return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
  }

  // ── 5. Create user profile ───────────────────────────────────────────────
  const dbRole = ROLE_MAP[role] ?? 'viewer'
  const { error: userError } = await admin
    .from('users')
    .insert({ id: user.id, org_id: org.id, email: user.email!, role: dbRole })

  if (userError) {
    console.error('[Sightline] Onboard — user insert error:', userError)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }

  // ── 6. Create workspace ──────────────────────────────────────────────────
  const { data: workspace, error: wsError } = await admin
    .from('workspaces')
    .insert({
      org_id:          org.id,
      name:            productName,
      product_context: productDescription || null,
    })
    .select('id')
    .single()

  if (wsError || !workspace) {
    console.error('[Sightline] Onboard — workspace insert error:', wsError)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }

  return NextResponse.json({ org_id: org.id, workspace_id: workspace.id })
}
