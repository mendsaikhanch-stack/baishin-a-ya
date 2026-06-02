import { createClient } from '@supabase/supabase-js'
import { runProviderChain } from '@/lib/ai/reply'
import {
  GUIDE_ARTICLES,
  CATEGORY_META,
  type GuideCategory,
  type ArticleSection,
} from '@/content/guide-articles'

/**
 * Knowledge-enrichment loop (Phase 2).
 *
 * Pulls unprocessed user chat questions, asks the AI to find recurring topics
 * that the existing guide library does NOT already cover, and drafts new
 * articles for those gaps. Drafts are saved as category='guide_draft',
 * published=false — they NEVER reach users or the AI advisor until a human
 * approves them in /admin/knowledge. (Construction advice must be verified.)
 */

const VALID_SUBCATEGORIES: GuideCategory[] = [
  'before_starting',
  'land_selection',
  'budget_planning',
  'material_selection',
  'foundation',
  'seasonal_timing',
]

export type EnrichResult = {
  ok: boolean
  questionsConsidered: number
  draftsCreated: number
  drafts: { slug: string; title: string; subcategory: string }[]
  note?: string
}

type DraftArticle = {
  subcategory: GuideCategory
  title: string
  summary: string
  slug: string
  sections: ArticleSection[]
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env')
  return createClient(url, key, { auth: { persistSession: false } })
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'draft'
  )
}

function sectionsToText(title: string, summary: string, sections: ArticleSection[]): string {
  const lines: string[] = [title, '', summary, '']
  for (const s of sections) {
    if (s.heading) lines.push(`## ${s.heading}`)
    if (s.body) for (const p of s.body) lines.push(p)
    if (s.bullets) for (const b of s.bullets) lines.push(`- ${b}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}

function extractJson(text: string): unknown {
  let t = text.trim()
  // Strip ```json fences if present.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  // Fall back to the first {...} or [...] block.
  const start = t.search(/[[{]/)
  if (start > 0) t = t.slice(start)
  return JSON.parse(t)
}

const ENRICH_SYSTEM_PROMPT = `Чи бол "БОСГО" мэдлэгийн сангийн редактор. Монголд байшин барих хүмүүсийн чатад асуусан асуултуудаас давтагдах сэдвийг олж, ОДОО БАЙГАА нийтлэлд хараахан хамрагдаагүй цоорхойг нөхөх шинэ гарын авлагын нийтлэл боловсруулна.

ХАТУУ ДҮРЭМ:
- Зөвхөн ОДОО БАЙГАА нийтлэлийн жагсаалтад ОРООГҮЙ, давтагдсан/чухал сэдвээр л шинэ нийтлэл санал болго. Давхардуулж бүү бич.
- Хангалттай давтагдаагүй, эсвэл аль хэдийн хамрагдсан сэдэв бол алгас. Чанар > тоо. Хэрэв тохирох цоорхой алга бол хоосон массив буцаа.
- Нэг удаад дээд тал нь 3 нийтлэл.
- Барилгын аюулгүй байдал, даац, инженерийн нарийн тооцоонд "⚠️ мэргэжлийн инженерээр баталгаажуул" гэсэн сэрэмжлүүлэг оруул. Хэт тодорхой тоо (үнэ, гүн) -г ердийн ХЯЗГААРААР өг.
- Монгол кирилл, "Та" хэлбэрээр, ойлгомжтой бич.

ЗӨВХӨН дараах хэлбэрийн JSON буцаа (тайлбар, markdown fence, өөр текст БҮҮ нэм):
{
  "articles": [
    {
      "subcategory": "before_starting | land_selection | budget_planning | material_selection | foundation | seasonal_timing",
      "title": "Богино гарчиг",
      "summary": "1-2 өгүүлбэр хураангуй",
      "slug": "english-kebab-slug",
      "sections": [
        { "heading": "Гарчиг (заавал биш)", "body": ["догол мөр", "..."], "bullets": ["цэг", "..."] }
      ]
    }
  ]
}`

export async function runEnrichment(opts?: {
  minQuestions?: number
  maxQuestions?: number
}): Promise<EnrichResult> {
  const minQuestions = opts?.minQuestions ?? 5
  const maxQuestions = opts?.maxQuestions ?? 200
  const supabase = getClient()

  // 1. Pull unprocessed questions.
  const { data: questions, error: qErr } = await supabase
    .from('chat_questions')
    .select('id, question')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(maxQuestions)

  if (qErr) {
    return {
      ok: false,
      questionsConsidered: 0,
      draftsCreated: 0,
      drafts: [],
      note: `chat_questions унших алдаа: ${qErr.message}`,
    }
  }

  const qList = questions ?? []
  if (qList.length < minQuestions) {
    return {
      ok: true,
      questionsConsidered: qList.length,
      draftsCreated: 0,
      drafts: [],
      note: `Хангалттай асуулт алга (${qList.length}/${minQuestions}). Алгассан.`,
    }
  }

  // 2. Existing coverage — titles+summaries from repo core and DB.
  const { data: dbArticles } = await supabase
    .from('content_articles')
    .select('title, summary, slug, category')
    .in('category', ['guide', 'guide_draft'])
    .limit(500)

  const existingSlugs = new Set<string>([
    ...GUIDE_ARTICLES.map((a) => a.slug),
    ...(dbArticles ?? []).map((a) => a.slug),
  ])
  const existingTitles = [
    ...GUIDE_ARTICLES.map((a) => a.title),
    ...(dbArticles ?? []).map((a) => a.title),
  ]

  // 3. Ask the AI to draft gap-filling articles.
  const userPrompt = `# Одоо байгаа нийтлэлүүд (давхардуулж болохгүй)
${existingTitles.map((t) => `- ${t}`).join('\n')}

# Хэрэглэгчдийн асуултууд (${qList.length})
${qList.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Дээрх асуултаас давтагдах, одоо байгаа нийтлэлд хамрагдаагүй сэдвээр шинэ нийтлэл боловсруулж JSON-оор буцаа.`

  let parsed: unknown
  try {
    const text = await runProviderChain({
      history: [{ role: 'user', content: userPrompt }],
      context: {},
      systemPrompt: ENRICH_SYSTEM_PROMPT,
      contextBlock: null,
    })
    parsed = extractJson(text)
  } catch (e) {
    return {
      ok: false,
      questionsConsidered: qList.length,
      draftsCreated: 0,
      drafts: [],
      note: `AI ноорог үүсгэх алдаа: ${(e as Error).message}`,
    }
  }

  const rawArticles =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as { articles?: unknown }).articles)
      ? ((parsed as { articles: unknown[] }).articles)
      : []

  // 4. Validate + dedupe drafts.
  const drafts: DraftArticle[] = []
  for (const raw of rawArticles.slice(0, 3)) {
    if (!raw || typeof raw !== 'object') continue
    const a = raw as Record<string, unknown>
    const subcategory = VALID_SUBCATEGORIES.includes(a.subcategory as GuideCategory)
      ? (a.subcategory as GuideCategory)
      : 'before_starting'
    const title = typeof a.title === 'string' ? a.title.trim() : ''
    const summary = typeof a.summary === 'string' ? a.summary.trim() : ''
    const sections = Array.isArray(a.sections) ? (a.sections as ArticleSection[]) : []
    if (!title || sections.length === 0) continue

    let slug = slugify(typeof a.slug === 'string' && a.slug ? a.slug : title)
    if (existingSlugs.has(slug)) {
      let n = 2
      while (existingSlugs.has(`${slug}-${n}`)) n++
      slug = `${slug}-${n}`
    }
    existingSlugs.add(slug)
    drafts.push({ subcategory, title, summary, slug, sections })
  }

  // 5. Insert drafts (published=false) + mark questions processed.
  if (drafts.length > 0) {
    const records = drafts.map((d, i) => ({
      category: 'guide_draft',
      subcategory: d.subcategory,
      title: d.title,
      slug: d.slug,
      summary: `${CATEGORY_META[d.subcategory].title} — ${d.summary}`,
      content: sectionsToText(d.title, d.summary, d.sections),
      language: 'mn',
      published: false,
      order_index: 900 + i,
    }))
    const { error: insErr } = await supabase
      .from('content_articles')
      .upsert(records, { onConflict: 'slug' })
    if (insErr) {
      return {
        ok: false,
        questionsConsidered: qList.length,
        draftsCreated: 0,
        drafts: [],
        note: `Ноорог хадгалах алдаа: ${insErr.message}`,
      }
    }
  }

  // Mark all considered questions processed (even if 0 drafts — they were reviewed).
  const ids = qList.map((q) => q.id)
  const nowIso = new Date().toISOString()
  await supabase
    .from('chat_questions')
    .update({ processed_at: nowIso })
    .in('id', ids)

  return {
    ok: true,
    questionsConsidered: qList.length,
    draftsCreated: drafts.length,
    drafts: drafts.map((d) => ({
      slug: d.slug,
      title: d.title,
      subcategory: d.subcategory,
    })),
  }
}
