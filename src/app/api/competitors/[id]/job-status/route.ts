import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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
    .select('id')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .single()

  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  // Fetch latest scraping job
  const { data: job } = await supabase
    .from('scraping_jobs')
    .select('status, signals_extracted, error_message, attempts, created_at, updated_at')
    .eq('competitor_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!job) {
    return NextResponse.json({ status: 'none' })
  }

  return NextResponse.json({
    status: job.status,
    signals_extracted: job.signals_extracted,
    error_message: job.error_message,
    attempts: job.attempts,
    created_at: job.created_at,
    updated_at: job.updated_at,
  })
}
