import { NextResponse } from 'next/server'
import { runEnrichment } from '@/lib/knowledge/enrich'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Knowledge-enrichment trigger. Generates draft articles from logged chat
 * questions (drafts only — never auto-published). Cron-ready.
 *
 * Auth (any one):
 *  - header `x-internal-secret: <INTERNAL_API_SECRET>`  (manual / script)
 *  - header `Authorization: Bearer <CRON_SECRET | INTERNAL_API_SECRET>` (Vercel cron)
 */
function isAuthorized(req: Request): boolean {
  const internal = process.env.INTERNAL_API_SECRET
  const cron = process.env.CRON_SECRET
  const headerSecret = req.headers.get('x-internal-secret')
  if (internal && headerSecret === internal) return true

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    if (cron && token === cron) return true
    if (internal && token === internal) return true
  }
  return false
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
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

export async function POST(req: Request) {
  return handle(req)
}

// Vercel Cron triggers GET requests.
export async function GET(req: Request) {
  return handle(req)
}
