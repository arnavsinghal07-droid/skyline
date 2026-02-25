import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BriefContent } from '../generate/route'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  const { org_id } = profile

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', org_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!workspace) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  }

  let brief: BriefContent
  let queryId: string
  try {
    const body = await request.json()
    brief = body.brief
    queryId = body.queryId
    if (!brief || !queryId) {
      return NextResponse.json({ error: 'Missing brief or queryId' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: savedBrief, error: insertError } = await supabase
    .from('briefs')
    .insert({
      query_id:     queryId,
      org_id,
      workspace_id: workspace.id,
      content_json: brief,
    })
    .select('id')
    .single()

  if (insertError || !savedBrief) {
    console.error('[Sightline] Brief save error:', insertError)
    return NextResponse.json({ error: 'Failed to save brief' }, { status: 500 })
  }

  return NextResponse.json({ id: savedBrief.id })
}
