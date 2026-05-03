import { SYSTEM_PROMPT, buildContextBlock } from './system-prompt'
import type { ChatTurn, Provider, ProviderInput } from './types'
import { anthropicProvider } from './providers/anthropic'
import { geminiProvider } from './providers/gemini'
import { groqProvider } from './providers/groq'

export type { ChatTurn } from './types'

const PROVIDERS: Record<string, Provider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  anthropic: anthropicProvider,
}

function resolveProviderChain(): string[] {
  const primary = (process.env.AI_PROVIDER || 'gemini').toLowerCase()
  const fallbacks = (process.env.AI_FALLBACK_PROVIDERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const chain: string[] = []
  for (const name of [primary, ...fallbacks]) {
    if (PROVIDERS[name] && !chain.includes(name)) {
      chain.push(name)
    }
  }
  if (chain.length === 0) chain.push('gemini')
  return chain
}

const MAX_HISTORY_TURNS = 10

export async function getAIReply(
  history: ChatTurn[],
  context: unknown,
): Promise<string> {
  if (history.length === 0) {
    throw new Error('Хоосон яриа.')
  }
  if (![...history].some((m) => m.role === 'user')) {
    throw new Error('Хэрэглэгчийн мессеж олдсонгүй.')
  }

  const trimmed = history.slice(-MAX_HISTORY_TURNS)
  const input: ProviderInput = {
    history: trimmed,
    context,
    systemPrompt: SYSTEM_PROMPT,
    contextBlock: buildContextBlock(context),
  }

  const chain = resolveProviderChain()
  const isDev = process.env.NODE_ENV !== 'production'
  const errors: { provider: string; error: string }[] = []

  for (const name of chain) {
    const provider = PROVIDERS[name]
    try {
      const result = await provider(input)
      if (isDev) {
        console.log('[ai/reply] trace:', result.trace, errors.length ? { fellBackFrom: errors } : '')
      }
      return result.text
    } catch (e) {
      const msg = (e as Error).message
      errors.push({ provider: name, error: msg })
      if (isDev) {
        console.warn(`[ai/reply] provider ${name} failed:`, msg)
      }
    }
  }

  throw new Error(
    `Бүх AI provider амжилтгүй боллоо: ${errors.map((e) => `${e.provider}=${e.error}`).join('; ')}`,
  )
}
