import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/competitors/signals
 * Returns all competitive signals for the user's org, with competitor names joined.
 * Used by the query page evidence panel to display the "Competitive Signals" tab.
 */
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

  // Fetch all competitors (non-deleted) for name lookup
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)

  const competitorMap = new Map(
    (competitors ?? []).map(c => [c.id, c.name])
  )

  // Fetch all competitive signals for the org
  const { data: signals, error } = await supabase
    .from('competitive_signals')
    .select('id, competitor_id, quote, signal_type, source, review_date')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Join competitor names
  const enrichedSignals = (signals ?? []).map(s => ({
    id: s.id,
    quote: s.quote,
    competitor_name: competitorMap.get(s.competitor_id) ?? 'Unknown',
    source: s.source,
    signal_type: s.signal_type,
    review_date: s.review_date,
  }))

  return NextResponse.json({ signals: enrichedSignals })
}
