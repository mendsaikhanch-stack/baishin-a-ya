/**
 * Guide article seed — sync the repo guide articles (src/content/guide-articles.ts,
 * the source of truth) into Supabase content_articles (category=guide) so the AI
 * advisor can retrieve them via get_building_info({ type: 'guide' }).
 *
 * The /knowledge pages read the TS module directly; this only powers AI retrieval.
 *
 * Run:
 *   npx tsx scripts/seed-articles.ts
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import {
  GUIDE_ARTICLES,
  CATEGORY_META,
  articleToPlainText,
} from '../src/content/guide-articles'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

async function main() {
  const records = GUIDE_ARTICLES.map((a, i) => ({
    // category='guide' keeps these distinct from БНбД norms in the same table.
    category: 'guide',
    // subcategory carries the display group (before_starting, foundation, …).
    subcategory: a.category,
    title: a.title,
    slug: a.slug,
    summary: `${CATEGORY_META[a.category].title} — ${a.summary}`,
    content: articleToPlainText(a),
    language: 'mn',
    published: true,
    order_index: i + 1,
  }))

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  console.log(`[seed-articles] upserting ${records.length} guide articles…`)
  const { error } = await supabase
    .from('content_articles')
    .upsert(records, { onConflict: 'slug' })

  if (error) {
    console.error('[seed-articles] upsert error:', error.message)
    process.exit(1)
  }

  console.log(`[seed-articles] ✓ seeded ${records.length} guide articles`)
  for (const r of records) console.log(`  • ${r.slug} — ${r.title}`)
}

main().catch((err) => {
  console.error('[seed-articles] fatal:', err)
  process.exit(1)
})
