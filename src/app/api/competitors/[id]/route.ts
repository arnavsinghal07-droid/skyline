import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
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

  // Verify competitor belongs to this org
  const { data: existing } = await supabase
    .from('competitors')
    .select('id')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  let updates: Record<string, unknown>
  try {
    const body = await request.json()
    updates = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.g2_slug !== undefined) updates.g2_slug = body.g2_slug || null
    if (body.capterra_slug !== undefined) updates.capterra_slug = body.capterra_slug || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('competitors')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ competitor: updated })
}

export async function DELETE(
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

  // Verify competitor belongs to this org
  const { data: existing } = await supabase
    .from('competitors')
    .select('id')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  // Soft delete
  const { error } = await supabase
    .from('competitors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
