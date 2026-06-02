import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { runEnrichment } from '@/lib/knowledge/enrich'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Admin-triggered enrichment run (no shared secret needed — admin session auth). */
export async function POST() {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.reason }, { status: admin.status })
  }
  try {
    const result = await runEnrichment()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, code: 'enrich_failed' },
      { status: 500 },
    )
  }
}
