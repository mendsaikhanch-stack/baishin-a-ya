/**
 * BNbD ingestion — extract a Mongolian construction code PDF and insert
 * each top-level chapter into Supabase content_articles (category=norm).
 *
 * Run:
 *   npx tsx scripts/ingest-bnbd.ts <bnbd-code> <pdf-path>
 *
 * If the PDF is scanned (no extractable text), it falls back to Gemini
 * vision OCR using the existing GOOGLE_API_KEY.
 *
 * Example:
 *   npx tsx scripts/ingest-bnbd.ts "30-01-24" scripts/pdfs/bnbd-30-01-24.pdf
 */
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const MIN_TEXT_LEN = 500
const MAX_CHARS = 6000

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

const [, , bnbdCode, pdfArg] = process.argv
if (!bnbdCode || !pdfArg) {
  console.error('Usage: npx tsx scripts/ingest-bnbd.ts <bnbd-code> <pdf-path>')
  process.exit(1)
}

const pdfPath = resolve(pdfArg)
if (!existsSync(pdfPath)) {
  console.error('PDF not found:', pdfPath)
  process.exit(1)
}

type Chapter = { num: number; title: string; body: string }
type Chunk = {
  chapterNum: number
  chapterTitle: string
  partIndex: number
  totalParts: number
  text: string
}

async function ocrPagesWithGemini(
  file: string,
  startPage: number,
  endPage: number,
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY needed for OCR fallback')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 32768,
      temperature: 0,
    },
  })
  const pdfBytes = readFileSync(file)
  const prompt = `Энэхүү PDF баримтын ${startPage}–${endPage} ХУУДАСНЫ БҮХ Монгол Кирилл текстийг ҮГ ҮСЭГГҮЙ ХАСАЛТГҮЙ транскрипц хийж буцаа.

ХАТУУ ШААРДЛАГА:
- Хураангуйлахгүй, хэт товчлохгүй — ЯГ ТЭР ХЭЛБЭРЭЭР нь буцаа.
- Бүлгийн дугаар, гарчгийг хадгал ("1. Хэрэглэх хүрээ", "4.2 ...", "Нэг.", "Хоёр.")
- Хүснэгтийн утгууд, томьёо, тоонуудыг бүгдийг бичих
- Хуудас тус бүрийн эхэнд "[Page N]" гэж тэмдэглэ
- Зөвхөн транскрипциас өөр зүйл буцаахгүй (тайлбар, summary, "Бичсэн нь" гэх мэт мета мэдээлэл хориглоно)
- Хэрэв тухайн хуудаст текст алга бол "[Page N: empty]" гэж тэмдэглэ`

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBytes.toString('base64'),
      },
    },
    { text: prompt },
  ])
  return result.response.text()
}

async function ocrWithGemini(file: string): Promise<string> {
  // Try one full pass first; if it returns < 10K chars on a >500KB PDF, the
  // model probably summarized — re-OCR in 10-page slices.
  console.log('[ocr] attempting full-document pass…')
  const full = await ocrPagesWithGemini(file, 1, 9999)
  const sizeKB = readFileSync(file).length / 1024
  if (full.length >= 10000 || sizeKB < 300) return full

  console.log(
    `[ocr] full pass returned only ${full.length} chars on ${sizeKB.toFixed(0)}KB PDF — splitting by pages…`,
  )
  // Crude page-range slicing: ask in 10-page windows up to a high cap.
  const parts: string[] = []
  for (let start = 1; start <= 200; start += 10) {
    const slice = await ocrPagesWithGemini(file, start, start + 9)
    if (!slice.trim() || /\[Page \d+: empty\]/.test(slice) && slice.length < 200) {
      console.log(`[ocr] no more pages after ${start - 1}`)
      break
    }
    parts.push(slice)
    console.log(`[ocr] pages ${start}-${start + 9}: ${slice.length} chars`)
  }
  return parts.join('\n\n')
}

function findDocTitle(text: string, fallback: string): string {
  const lines = text.split(/\r?\n/).slice(0, 60)
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed.length > 15 &&
      trimmed.length < 200 &&
      /[А-ЯӨҮ]/.test(trimmed) &&
      !/^\d/.test(trimmed) &&
      !/Áàðèëãûí|ÌÎÍÃÎË/.test(trimmed)
    ) {
      return trimmed.replace(/\s+/g, ' ')
    }
  }
  return fallback
}

function splitChapters(text: string): Chapter[] {
  const lines = text.split(/\r?\n/)
  const tocRe = /^(\d{1,2})\.\s+(.+?)\s*\.{4,}\s*[\d-]+\s*$/
  const tocMap = new Map<number, string>()
  let lastTocNum = 0
  for (const line of lines) {
    const m = tocRe.exec(line)
    if (!m) continue
    const num = parseInt(m[1], 10)
    if (num !== lastTocNum + 1) continue
    tocMap.set(num, m[2].trim())
    lastTocNum = num
  }
  if (tocMap.size === 0) {
    console.warn(
      '[ingest] no TOC detected — falling back to plain numbered headings',
    )
  }

  const chapters: Chapter[] = []
  let current: Chapter | null = null
  let nextExpected = 1
  let inBody = false
  for (const line of lines) {
    const trimmed = line.trim()
    const m = /^(\d{1,2})\.\s+(.+?)\s*$/.exec(trimmed)
    if (m && !/\.{4,}/.test(trimmed)) {
      const num = parseInt(m[1], 10)
      const title = m[2].trim()
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
    if (inBody && current) current.body += line + '\n'
  }
  if (current) chapters.push(current)
  return chapters
}

function chunkBody(chapter: Chapter): Chunk[] {
  const body = chapter.body.trim()
  if (body.length <= MAX_CHARS) {
    return [
      {
        chapterNum: chapter.num,
        chapterTitle: chapter.title,
        partIndex: 1,
        totalParts: 1,
        text: body,
      },
    ]
  }

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

async function main() {
  // 1. Extract text via pdftotext; fall back to Gemini OCR if scanned.
  const txtPath = pdfPath.replace(/\.pdf$/i, '.txt')
  console.log(`[ingest] extracting text → ${basename(txtPath)}`)
  execFileSync('pdftotext', ['-enc', 'UTF-8', '-layout', pdfPath, txtPath], {
    stdio: 'inherit',
  })
  let raw = readFileSync(txtPath, 'utf8')

  if (raw.trim().length < MIN_TEXT_LEN) {
    console.warn(
      `[ingest] pdftotext returned only ${raw.trim().length} chars — falling back to Gemini OCR…`,
    )
    raw = await ocrWithGemini(pdfPath)
    writeFileSync(txtPath, raw, 'utf8')
    console.log(
      `[ingest] Gemini OCR produced ${raw.length} chars → ${basename(txtPath)}`,
    )
  }

  // 2. Doc title and chapters.
  const docTitle = findDocTitle(raw, `БНбД ${bnbdCode}`)
  console.log(`[ingest] doc title: ${docTitle}`)

  const chapters = splitChapters(raw)
  console.log(`[ingest] found ${chapters.length} chapters`)

  if (chapters.length === 0) {
    console.error(
      'No chapters detected. Inspect the .txt file and adjust the regex.',
    )
    process.exit(1)
  }

  const chunks = chapters.flatMap(chunkBody)
  console.log(`[ingest] produced ${chunks.length} chunks (after sub-splitting)`)

  // 3. Build records.
  const records = chunks.map((c, i) => {
    const baseSlug = `bnbd-${bnbdCode}-${c.chapterNum}`
    const slug = c.totalParts === 1 ? baseSlug : `${baseSlug}-p${c.partIndex}`
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

  const previewPath = pdfPath.replace(/\.pdf$/i, '.records.json')
  writeFileSync(previewPath, JSON.stringify(records, null, 2), 'utf8')
  console.log(`[ingest] wrote preview → ${basename(previewPath)}`)

  // 4. Upsert.
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })
  console.log(
    `[ingest] upserting ${records.length} records into content_articles…`,
  )
  const { error } = await supabase
    .from('content_articles')
    .upsert(records, { onConflict: 'slug' })

  if (error) {
    console.error('[ingest] upsert error:', error.message)
    process.exit(1)
  }

  console.log(`[ingest] ✓ ingested БНбД ${bnbdCode}: ${records.length} chunks`)
}

main().catch((err) => {
  console.error('[ingest] fatal:', err)
  process.exit(1)
})
