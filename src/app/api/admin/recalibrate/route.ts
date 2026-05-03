import { NextResponse } from 'next/server'
import { recalibratePrices, type PriceUpdate } from '@/lib/estimator/recalibrate'
import { createClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function isValidUpdate(u: unknown): u is PriceUpdate {
  if (!u || typeof u !== 'object') return false
  const r = u as Record<string, unknown>
  return (
    (r.house_type === 'frame' || r.house_type === 'block' || r.house_type === 'concrete') &&
    (r.quality === 'low' || r.quality === 'medium' || r.quality === 'high') &&
    typeof r.base_min === 'number' &&
    typeof r.base_max === 'number' &&
    r.base_min > 0 &&
    r.base_max > r.base_min
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'admin_only' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const b = body as { updates?: unknown; reason?: unknown }
  if (!Array.isArray(b.updates) || b.updates.length === 0) {
    return NextResponse.json({ error: 'updates required (non-empty array)' }, { status: 400 })
  }
  if (!b.updates.every(isValidUpdate)) {
    return NextResponse.json({ error: 'invalid update payload' }, { status: 400 })
  }

  try {
    const result = await recalibratePrices({
      updates: b.updates,
      reason: typeof b.reason === 'string' ? b.reason : 'ad-hoc adjustment',
      changed_by: user.email!,
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    )
  }
}
