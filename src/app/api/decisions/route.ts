import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, rationale, confidence, outcome, outcome_date, created_at, users(email)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ decisions: decisions ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  const { org_id } = profile

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', org_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const CONFIDENCE_MAP: Record<string, number> = { HIGH: 1.0, MEDIUM: 0.6, LOW: 0.3 }

  let briefId: string
  let title: string
  let confidenceNumeric: number
  try {
    const body = await request.json()
    briefId = body.briefId
    title = (body.title ?? '').trim()
    confidenceNumeric = CONFIDENCE_MAP[body.confidence] ?? 1.0
    if (!briefId || !title) {
      return NextResponse.json({ error: 'Missing briefId or title' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      brief_id:     briefId,
      org_id,
      workspace_id: workspace.id,
      user_id:      user.id,
      title,
      confidence:   confidenceNumeric,
      evidence_ids: [],
    })
    .select('id')
    .single()

  if (error || !decision) {
    console.error('[Sightline] Decision insert error:', error)
    return NextResponse.json({ error: 'Failed to log decision' }, { status: 500 })
  }

  return NextResponse.json({ id: decision.id })
}
