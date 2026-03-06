import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scanForCompetitorMentions } from '@/lib/competitive/scan-mentions'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  // Verify competitor belongs to org
  const { data: competitor } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .single()

  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  // Run scan in background
  after(async () => {
    try {
      const bgSupabase = await createClient()
      await scanForCompetitorMentions(bgSupabase, profile.org_id, id, competitor.name)
    } catch (err) {
      console.error('[Sightline] Re-scan failed:', err)
    }
  })

  return NextResponse.json({ scanning: true, competitorId: id }, { status: 202 })
}
