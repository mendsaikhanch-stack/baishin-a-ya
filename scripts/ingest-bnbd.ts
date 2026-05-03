/**
 * BNbD ingestion — extract a Mongolian construction code PDF and insert
 * each top-level chapter into Supabase content_articles (category=norm).
 *
 * Run:
 *   npx tsx scripts/ingest-bnbd.ts <bnbd-code> <pdf-path>
 *
 * Example:
 *   npx tsx scripts/ingest-bnbd.ts "30-01-24" scripts/pdfs/bnbd-30-01-24.pdf
 */
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const [, , bnbdCode, pdfArg] = process.argv
if (!bnbdCode || !pdfArg) {
  console.error('Usage: npx tsx scripts/ingest-bnbd.ts <bnbd-code> <pdf-path>')
  console.error('Example: npx tsx scripts/ingest-bnbd.ts "30-01-24" scripts/pdfs/bnbd-30-01-24.pdf')
  process.exit(1)
}

const pdfPath = resolve(pdfArg)
if (!existsSync(pdfPath)) {
  console.error('PDF not found:', pdfPath)
  process.exit(1)
}

// 1. Extract text via pdftotext (assumes it is installed)
const txtPath = pdfPath.replace(/\.pdf$/i, '.txt')
console.log(`[ingest] extracting text → ${basename(txtPath)}`)
execFileSync('pdftotext', ['-enc', 'UTF-8', '-layout', pdfPath, txtPath], {
  stdio: 'inherit',
})

const raw = readFileSync(txtPath, 'utf8')

// 2. Find document title from the first ~30 lines
function findDocTitle(text: string): string {
  const lines = text.split(/\r?\n/).slice(0, 60)
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed.length > 15 &&
      trimmed.length < 200 &&
      /[А-ЯӨҮ]/.test(trimmed) &&
      !/^\d/.test(trimmed) &&
      !/Áàðèëãûí|ÌÎÍÃÎË/.test(trimmed) // mojibake header lines
    ) {
      return trimmed.replace(/\s+/g, ' ')
    }
  }
  return `БНбД ${bnbdCode}`
}

const docTitle = findDocTitle(raw)
console.log(`[ingest] doc title: ${docTitle}`)

// 3. Split into chapters by lines starting with "<n>. " where the rest of the line
//    is a Cyrillic heading (not a TOC entry with dots).
type Chapter = { num: number; title: string; body: string }

function splitChapters(text: string): Chapter[] {
  const lines = text.split(/\r?\n/)

  // Pass 1: extract chapter titles from TOC. TOC lines look like:
  //   "1. Хэрэглэх хүрээ............................................................2"
  //   "13. Хавсралтууд......................................................75-103"
  // Trailing dot-leader + page-range distinguishes them from in-body numbered items.
  const tocRe = /^(\d{1,2})\.\s+(.+?)\s*\.{4,}\s*[\d-]+\s*$/
  const tocMap = new Map<number, string>()
  let lastTocNum = 0
  for (const line of lines) {
    const m = tocRe.exec(line)
    if (!m) continue
    const num = parseInt(m[1], 10)
    if (num !== lastTocNum + 1) continue // must be sequential
    tocMap.set(num, m[2].trim())
    lastTocNum = num
  }

  if (tocMap.size === 0) {
    console.warn('[ingest] no TOC detected — falling back to plain numbered headings')
  }

  // Pass 2: walk body lines and split at the first body occurrence of each TOC heading.
  // Body heading line ≈ "1. Хэрэглэх хүрээ" (no dot-leader).
  const chapters: Chapter[] = []
  let current: Chapter | null = null
  let nextExpected = 1
  let inBody = false

  for (const line of lines) {
    const trimmed = line.trim()
    const headRe = /^(\d{1,2})\.\s+(.+?)\s*$/
    const m = headRe.exec(trimmed)
    if (m && !/\.{4,}/.test(trimmed)) {
      const num = parseInt(m[1], 10)
      const title = m[2].trim()
      // Accept any chapter number >= nextExpected (allows skipping chapters
      // whose body heading is missing or formatted oddly). Cap at TOC max so
      // numbered list items inside bodies (e.g. "4. Some sub-item" deep in
      // chapter 12) don't get interpreted as a new chapter.
      const tocMax = tocMap.size > 0 ? Math.max(...tocMap.keys()) : 50
      if (num >= nextExpected && num <= tocMax) {
        const tocTitle = tocMap.get(num)
        if (current) chapters.push(current)
        current = { num, title: tocTitle ?? title, body: '' }
        nextExpected = num + 1
        inBody = true
        continue
      }
    }
    if (inBody && current) {
      current.body += line + '\n'
    }
  }
  if (current) chapters.push(current)
  return chapters
}

const chapters = splitChapters(raw)
console.log(`[ingest] found ${chapters.length} chapters`)

if (chapters.length === 0) {
  console.error('No chapters detected. Inspect the .txt file and adjust the regex.')
  process.exit(1)
}

// 4. Sub-chunk any chapter exceeding ~6000 chars at sub-section boundaries (e.g. "4.2 ")
type Chunk = {
  chapterNum: number
  chapterTitle: string
  partIndex: number
  totalParts: number
  text: string
}

const MAX_CHARS = 6000

function chunkBody(chapter: Chapter): Chunk[] {
  const body = chapter.body.trim()
  if (body.length <= MAX_CHARS) {
    return [{
      chapterNum: chapter.num,
      chapterTitle: chapter.title,
      partIndex: 1,
      totalParts: 1,
      text: body,
    }]
  }

  // Try splitting on sub-section headings like "4.1 ", "4.10 "
  const subRe = new RegExp(`^${chapter.num}\\.\\d+`, 'm')
  const parts: string[] = []
  const lines = body.split(/\r?\n/)
  let buf: string[] = []
  for (const line of lines) {
    if (subRe.test(line) && buf.length > 0) {
      parts.push(buf.join('\n'))
      buf = []
    }
    buf.push(line)
  }
  if (buf.length > 0) parts.push(buf.join('\n'))

  // Merge tiny adjacent parts so we end up with reasonably sized chunks
  const merged: string[] = []
  let acc = ''
  for (const p of parts) {
    if ((acc + '\n' + p).length > MAX_CHARS && acc.length > 0) {
      merged.push(acc)
      acc = p
    } else {
      acc = acc ? acc + '\n' + p : p
    }
  }
  if (acc) merged.push(acc)

  // Hard-truncate any chunk still too long
  const final = merged.flatMap((p) => {
    if (p.length <= MAX_CHARS * 1.5) return [p]
    const slices: string[] = []
    for (let i = 0; i < p.length; i += MAX_CHARS) {
      slices.push(p.slice(i, i + MAX_CHARS))
    }
    return slices
  })

  return final.map((text, i) => ({
    chapterNum: chapter.num,
    chapterTitle: chapter.title,
    partIndex: i + 1,
    totalParts: final.length,
    text: text.trim(),
  }))
}

const chunks: Chunk[] = chapters.flatMap(chunkBody)
console.log(`[ingest] produced ${chunks.length} chunks (after sub-splitting)`)

// 5. Build records and upsert into Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-яёөү\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

const records = chunks.map((c, i) => {
  const baseSlug = `bnbd-${bnbdCode}-${c.chapterNum}`
  const slug =
    c.totalParts === 1 ? baseSlug : `${baseSlug}-p${c.partIndex}`
  const title = `БНбД ${bnbdCode} — ${c.chapterNum}. ${c.chapterTitle}${
    c.totalParts > 1 ? ` (хэсэг ${c.partIndex}/${c.totalParts})` : ''
  }`
  const summary = c.text.replace(/\s+/g, ' ').slice(0, 240)
  return {
    category: 'norm',
    title,
    slug,
    summary,
    content: c.text,
    language: 'mn',
    published: true,
    order_index: i + 1,
  }
})

// Save a JSON preview locally for inspection
const previewPath = pdfPath.replace(/\.pdf$/i, '.records.json')
writeFileSync(previewPath, JSON.stringify(records, null, 2), 'utf8')
console.log(`[ingest] wrote preview → ${basename(previewPath)}`)

async function main() {
  console.log(`[ingest] upserting ${records.length} records into content_articles…`)

  const { error } = await supabase
    .from('content_articles')
    .upsert(records, { onConflict: 'slug' })

  if (error) {
    console.error('[ingest] upsert error:', error.message)
    process.exit(1)
  }

  console.log(`[ingest] ✓ ingested БНбД ${bnbdCode}: ${records.length} chunks`)
}

main()
