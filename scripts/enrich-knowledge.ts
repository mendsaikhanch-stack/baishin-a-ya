/**
 * Manual trigger for the knowledge-enrichment loop.
 *
 * The actual logic runs inside Next (so the '@/' alias + AI provider chain
 * resolve correctly); this script just calls the protected API route.
 *
 * Dev server must be running. Run:
 *   npx tsx scripts/enrich-knowledge.ts
 *
 * Target a deployed instance with:
 *   ENRICH_URL=https://your-domain/api/internal/enrich-knowledge npx tsx scripts/enrich-knowledge.ts
 */
import { config } from 'dotenv'

config({ path: '.env.local' })

const URL =
  process.env.ENRICH_URL ||
  `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/enrich-knowledge`
const SECRET = process.env.INTERNAL_API_SECRET

if (!SECRET) {
  console.error('Missing INTERNAL_API_SECRET in .env.local')
  process.exit(1)
}

async function main() {
  console.log(`[enrich] POST ${URL}`)
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'x-internal-secret': SECRET as string },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`[enrich] HTTP ${res.status}:`, body)
    process.exit(1)
  }
  console.log('[enrich] result:', JSON.stringify(body, null, 2))
}

main().catch((err) => {
  console.error('[enrich] fatal:', err)
  process.exit(1)
})
