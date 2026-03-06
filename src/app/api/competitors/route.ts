import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { COMPETITOR_LIMITS } from '@/lib/competitive/types'
import { scanForCompetitorMentions } from '@/lib/competitive/scan-mentions'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  const { data: competitors, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch signal counts per competitor
  const competitorsWithCounts = await Promise.all(
    (competitors ?? []).map(async (comp) => {
      const { count } = await supabase
        .from('competitive_signals')
        .select('id', { count: 'exact', head: true })
        .eq('competitor_id', comp.id)

      return { ...comp, signal_count: count ?? 0 }
    })
  )

  return NextResponse.json({ competitors: competitorsWithCounts })
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

  // Get org plan for limit enforcement
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', org_id)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  // Check plan limit
  const { count } = await supabase
    .from('competitors')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org_id)
    .is('deleted_at', null)

  const limit = COMPETITOR_LIMITS[org.plan] ?? 3
  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: 'competitor_limit_reached', limit },
      { status: 402 }
    )
  }

  // Parse body
  let name: string
  let g2_slug: string | null = null
  let capterra_slug: string | null = null
  try {
    const body = await request.json()
    name = (body.name ?? '').trim()
    g2_slug = body.g2_slug || null
    capterra_slug = body.capterra_slug || null
    if (!name) {
      return NextResponse.json({ error: 'Missing competitor name' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', org_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  // Insert competitor
  const { data: competitor, error } = await supabase
    .from('competitors')
    .insert({
      org_id,
      workspace_id: workspace.id,
      name,
      g2_slug,
      capterra_slug,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-scan existing chunks for mentions (fire-and-forget)
  after(async () => {
    try {
      const adminSupabase = await createClient()
      await scanForCompetitorMentions(adminSupabase, org_id, competitor.id, name)
    } catch (err) {
      console.error('[Sightline] Auto-scan failed:', err)
    }
  })

  return NextResponse.json({ competitor }, { status: 201 })
}
