import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { HouseType, Quality } from './types'

// Lazy init — module load үед env vars байхгүй бол build crash болохгүй.
let _supabase: SupabaseClient | null = null
function supabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return _supabase
}

export type PriceUpdate = {
  house_type: HouseType
  quality: Quality
  base_min: number
  base_max: number
}

export type RecalibrateResult = {
  from_version: number
  to_version: number
  updated_rows: number
}

export async function recalibratePrices(opts: {
  updates: PriceUpdate[]
  reason: string
  changed_by: string
}): Promise<RecalibrateResult> {
  if (opts.updates.length === 0) {
    throw new Error('updates array is empty')
  }

  // 1. Current active version
  const { data: cur, error: curErr } = await supabase()
    .from('price_table')
    .select('version')
    .is('retired_at', null)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (curErr) throw new Error(`fetch current version failed: ${curErr.message}`)
  const fromV = cur?.version ?? 0
  const toV = fromV + 1

  // 2. Snapshot existing rows for the diff
  const { data: oldRows } = await supabase()
    .from('price_table')
    .select('house_type, quality, base_min, base_max')
    .eq('version', fromV)
    .is('retired_at', null)

  // 3. Insert new version rows
  const { error: insErr } = await supabase().from('price_table').insert(
    opts.updates.map((u) => ({ version: toV, ...u })),
  )
  if (insErr) throw new Error(`insert new version failed: ${insErr.message}`)

  // 4. Retire prior version
  const { error: retErr } = await supabase()
    .from('price_table')
    .update({ retired_at: new Date().toISOString() })
    .eq('version', fromV)
    .is('retired_at', null)
  if (retErr) throw new Error(`retire old version failed: ${retErr.message}`)

  // 5. Audit log
  await supabase().from('recalibration_log').insert({
    table_name: 'price_table',
    from_version: fromV,
    to_version: toV,
    diff: { before: oldRows ?? [], after: opts.updates },
    reason: opts.reason,
    changed_by: opts.changed_by,
  })

  return { from_version: fromV, to_version: toV, updated_rows: opts.updates.length }
}
