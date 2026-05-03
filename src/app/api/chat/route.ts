import { NextResponse } from 'next/server'
import { getAIReply, type ChatTurn } from '@/lib/ai/reply'

export const maxDuration = 60
export const runtime = 'nodejs'

type ChatBody = {
  message?: unknown
  messages?: unknown
  context?: unknown
}

const MAX_HISTORY = 20
const MAX_CONTENT_LEN = 4000

function normalizeHistory(body: ChatBody): ChatTurn[] {
  const out: ChatTurn[] = []

  if (Array.isArray(body.messages)) {
    for (const raw of body.messages) {
      if (!raw || typeof raw !== 'object') continue
      const m = raw as { role?: unknown; content?: unknown }
      if (
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
      ) {
        out.push({
          role: m.role,
          content: m.content.trim().slice(0, MAX_CONTENT_LEN),
        })
      }
    }
  }

  if (typeof body.message === 'string' && body.message.trim()) {
    const trimmed = body.message.trim().slice(0, MAX_CONTENT_LEN)
    if (out.length === 0 || out[out.length - 1].content !== trimmed) {
      out.push({ role: 'user', content: trimmed })
    }
  }

  while (out.length > 0 && out[0].role !== 'user') {
    out.shift()
  }

  return out.slice(-MAX_HISTORY)
}

function hasAnyAIKey(): boolean {
  return Boolean(
    process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.ANTHROPIC_API_KEY,
  )
}

export async function POST(req: Request) {
  if (!hasAnyAIKey()) {
    return NextResponse.json(
      {
        error:
          'AI үйлчилгээ тохируулагдаагүй байна. GOOGLE_API_KEY, GROQ_API_KEY эсвэл ANTHROPIC_API_KEY-ийн ядаж нэгийг тохируулна уу.',
        code: 'missing_api_key',
      },
      { status: 503 },
    )
  }

  let body: ChatBody
  try {
    body = (await req.json()) as ChatBody
  } catch {
    return NextResponse.json(
      { error: 'Хүсэлтийн JSON буруу.', code: 'invalid_json' },
      { status: 400 },
    )
  }

  const history = normalizeHistory(body)
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return NextResponse.json(
      {
        error: 'Хоосон асуулт. message эсвэл messages талбар шаардлагатай.',
        code: 'empty_message',
      },
      { status: 400 },
    )
  }

  try {
    const reply = await getAIReply(history, body.context ?? {})
    return NextResponse.json({ reply })
  } catch (e) {
    const err = e as Error
    if (process.env.NODE_ENV !== 'production') {
      console.error('[chat] error:', err)
    }
    return NextResponse.json(
      {
        error: 'AI хариулт авахад алдаа гарлаа. Дахин оролдоно уу.',
        code: 'ai_error',
      },
      { status: 500 },
    )
  }
}
