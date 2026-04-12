import { NextResponse } from 'next/server'
import { getAIReply } from '@/lib/ai/reply'

export async function POST(req: Request) {
  const { message, context } = await req.json()
  const reply = await getAIReply(message, context)
  return NextResponse.json({ reply })
}
