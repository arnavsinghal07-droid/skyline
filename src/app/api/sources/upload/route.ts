import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CsvRow = {
  date?: string
  customer_name?: string
  source_type?: string
  content?: string
  [key: string]: string | undefined
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Resolve org_id from the user's profile ─────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'User profile not found. Complete onboarding first.' },
      { status: 404 }
    )
  }

  const { org_id } = profile

  // ── 3. Get or create a default workspace for the org ─────────────────────
  const { data: existingWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', org_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  let workspace_id: string

  if (existingWorkspace) {
    workspace_id = existingWorkspace.id
  } else {
    const { data: newWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ org_id, name: 'Default' })
      .select('id')
      .single()

    if (wsError || !newWorkspace) {
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }
    workspace_id = newWorkspace.id
  }

  // ── 4. Create a new source record for this upload ─────────────────────────
  const { data: source, error: sourceError } = await supabase
    .from('sources')
    .insert({
      org_id,
      workspace_id,
      type: 'csv',
      status: 'active',
      connector_config: {
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.email,
      },
    })
    .select('id')
    .single()

  if (sourceError || !source) {
    return NextResponse.json({ error: 'Failed to create source record' }, { status: 500 })
  }

  // ── 5. Parse and validate request body ───────────────────────────────────
  let rows: CsvRow[]
  try {
    const body = await request.json()
    rows = body.rows
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── 6. Insert one document per CSV row ────────────────────────────────────
  // Batch in chunks of 500 to stay within Supabase's payload limits
  const BATCH = 500
  let totalInserted = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)

    const documents = chunk.map(row => ({
      source_id:    source.id,
      org_id,
      workspace_id,
      type:         'customer_feedback',
      status:       'pending' as const,
      metadata: {
        date:          row.date          ?? null,
        customer_name: row.customer_name ?? null,
        source_type:   row.source_type   ?? null,
        content:       row.content       ?? null,
      },
      raw_url: null,
    }))

    const { error: insertError, count } = await supabase
      .from('documents')
      .insert(documents)
      .select('id', { count: 'exact', head: true })

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save documents (batch ${i / BATCH + 1}): ${insertError.message}` },
        { status: 500 }
      )
    }

    totalInserted += count ?? chunk.length
  }

  return NextResponse.json({ success: true, count: totalInserted })
}
