import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let outcome: string
  try {
    const body = await request.json()
    outcome = (body.outcome ?? '').trim()
    if (!outcome) return NextResponse.json({ error: 'outcome is required' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: decision, error } = await supabase
    .from('decisions')
    .update({ outcome, outcome_date: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select('id, outcome, outcome_date')
    .single()

  if (error || !decision) {
    console.error('[Sightline] Decision update error:', error)
    return NextResponse.json({ error: 'Failed to save outcome' }, { status: 500 })
  }

  return NextResponse.json({ decision })
}
