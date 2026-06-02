import { createClient } from '@supabase/supabase-js'
import {
  GUIDE_ARTICLES,
  CATEGORY_META,
  type GuideCategory,
  type ArticleSection,
} from '@/content/guide-articles'

/**
 * Unified read layer for the knowledge base. The repo module
 * (guide-articles.ts) is the curated CORE source of truth; approved
 * community articles live in Supabase (category='guide', published=true) and
 * are merged in so they go live WITHOUT a redeploy. Repo wins on slug conflict.
 */

export type DisplayArticle = {
  slug: string
  subcategory: GuideCategory
  categoryTitle: string
  icon: string
  title: string
  summary: string
  readMinutes: number
  sections: ArticleSection[]
  source: 'core' | 'community'
}

const VALID: GuideCategory[] = [
  'before_starting',
  'land_selection',
  'budget_planning',
  'material_selection',
  'foundation',
  'seasonal_timing',
]

// Cookieless anon client — published content is public, so this works in
// pages, generateMetadata, and static generation alike.
function readClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function repoToDisplay(a: (typeof GUIDE_ARTICLES)[number]): DisplayArticle {
  return {
    slug: a.slug,
    subcategory: a.category,
    categoryTitle: CATEGORY_META[a.category].title,
    icon: CATEGORY_META[a.category].icon,
    title: a.title,
    summary: a.summary,
    readMinutes: a.readMinutes,
    sections: a.sections,
    source: 'core',
  }
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(2, Math.round(words / 180))
}

/** Reverse of the section serializer used by the seed/enrich pipeline. */
export function parseSections(content: string): ArticleSection[] {
  const all = content.split(/\r?\n/)
  // Drop the leading title + summary echo (first two non-marker, non-empty lines).
  let dropped = 0
  const body: string[] = []
  for (const line of all) {
    if (
      dropped < 2 &&
      line.trim() &&
      !line.startsWith('## ') &&
      !line.startsWith('- ')
    ) {
      dropped++
      continue
    }
    body.push(line)
  }

  const sections: ArticleSection[] = []
  let current: ArticleSection | null = null
  const ensure = () => (current ??= { body: [], bullets: [] })
  for (const line of body) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current)
      current = { heading: line.slice(3).trim(), body: [], bullets: [] }
    } else if (line.startsWith('- ')) {
      ensure().bullets!.push(line.slice(2).trim())
    } else if (line.trim()) {
      ensure().body!.push(line.trim())
    }
  }
  if (current) sections.push(current)

  // Strip empty arrays for clean rendering.
  return sections.map((s) => ({
    heading: s.heading,
    body: s.body && s.body.length ? s.body : undefined,
    bullets: s.bullets && s.bullets.length ? s.bullets : undefined,
  }))
}

function dbRowToDisplay(row: {
  slug: string
  subcategory: string | null
  title: string
  summary: string | null
  content: string
}): DisplayArticle {
  const subcategory = (VALID as string[]).includes(row.subcategory ?? '')
    ? (row.subcategory as GuideCategory)
    : 'before_starting'
  const meta = CATEGORY_META[subcategory]
  // Stored summary is prefixed with "<categoryTitle> — "; strip for display.
  let summary = row.summary ?? ''
  const prefix = `${meta.title} — `
  if (summary.startsWith(prefix)) summary = summary.slice(prefix.length)
  return {
    slug: row.slug,
    subcategory,
    categoryTitle: meta.title,
    icon: meta.icon,
    title: row.title,
    summary,
    readMinutes: estimateReadMinutes(row.content),
    sections: parseSections(row.content),
    source: 'community',
  }
}

async function fetchPublishedDbGuides(): Promise<DisplayArticle[]> {
  const supabase = readClient()
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('content_articles')
      .select('slug, subcategory, title, summary, content')
      .eq('category', 'guide')
      .eq('published', true)
      .limit(500)
    if (error || !data) return []
    return data.map(dbRowToDisplay)
  } catch {
    return []
  }
}

/** All visible articles: repo core + approved community, deduped (repo wins). */
export async function getPublishedGuides(): Promise<DisplayArticle[]> {
  const core = GUIDE_ARTICLES.map(repoToDisplay)
  const coreSlugs = new Set(core.map((a) => a.slug))
  const community = (await fetchPublishedDbGuides()).filter(
    (a) => !coreSlugs.has(a.slug),
  )
  return [...core, ...community]
}

export type CategoryGroup = {
  category: GuideCategory
  title: string
  icon: string
  articles: DisplayArticle[]
}

export async function getGroupedGuides(): Promise<CategoryGroup[]> {
  const all = await getPublishedGuides()
  return VALID.map((category) => ({
    category,
    title: CATEGORY_META[category].title,
    icon: CATEGORY_META[category].icon,
    articles: all.filter((a) => a.subcategory === category),
  })).filter((g) => g.articles.length > 0)
}

export async function getGuideForDisplay(
  slug: string,
): Promise<DisplayArticle | null> {
  const repo = GUIDE_ARTICLES.find((a) => a.slug === slug)
  if (repo) return repoToDisplay(repo)

  const supabase = readClient()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('content_articles')
      .select('slug, subcategory, title, summary, content')
      .eq('category', 'guide')
      .eq('published', true)
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) return null
    return dbRowToDisplay(data)
  } catch {
    return null
  }
}
