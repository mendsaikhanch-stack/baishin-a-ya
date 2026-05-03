import { NextResponse } from 'next/server'
import { getAIReply } from '@/lib/ai/reply'

export const maxDuration = 60
export const runtime = 'nodejs'

type ChatBody = {
  message?: unknown
  messages?: unknown
  context?: unknown
}

function extractMessage(body: ChatBody): string | null {
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim()
  }
  if (Array.isArray(body.messages)) {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i] as { role?: string; content?: unknown }
      if (m && m.role === 'user' && typeof m.content === 'string' && m.content.trim()) {
        return m.content.trim()
      }
    }
  }
  return null
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: 'AI үйлчилгээ тохируулагдаагүй байна.',
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

  const message = extractMessage(body)
  if (!message) {
    return NextResponse.json(
      {
        error: 'Хоосон асуулт. message эсвэл messages талбар шаардлагатай.',
        code: 'empty_message',
      },
      { status: 400 },
    )
  }

  try {
    const reply = await getAIReply(message, body.context ?? {})
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
