import Anthropic from '@anthropic-ai/sdk'
import type { Provider, ProviderInput, ProviderResult, ToolSchema } from '../types'
import { TOOL_SCHEMAS, runTool } from '../tools'

const STRONG_KEYWORDS = [
  'бнбд',
  'снип',
  'инженер',
  'даац',
  'хийц',
  'бүтээц',
  'суурь',
  'газар хөдлөл',
  'нарийвчилсан',
  'баталгаатай',
  'compliance',
  'norm',
]

const STRONG_HINT_THRESHOLD = 2
const MAX_ITERATIONS = 5

function pickModel(message: string, context: unknown): string {
  const defaultModel =
    process.env.ANTHROPIC_MODEL_DEFAULT || 'claude-sonnet-4-6'
  const strongModel = process.env.ANTHROPIC_MODEL_STRONG || 'claude-opus-4-7'

  const lower = message.toLowerCase()
  let strongHits = 0
  for (const kw of STRONG_KEYWORDS) {
    if (lower.includes(kw)) strongHits += 1
  }

  if (
    /(?:цемент|тоосго|блок).+(?:үнэ|ханш|зах зээл)/i.test(message) ||
    /(?:үнэ|ханш).+(?:тооцоо|орц|материал)/i.test(message)
  ) {
    strongHits += 1
  }

  if (
    typeof context === 'object' &&
    context !== null &&
    'forceStrongModel' in context &&
    (context as { forceStrongModel?: boolean }).forceStrongModel === true
  ) {
    return strongModel
  }

  return strongHits >= STRONG_HINT_THRESHOLD ? strongModel : defaultModel
}

function toAnthropicTool(schema: ToolSchema): Anthropic.Tool {
  return {
    name: schema.name,
    description: schema.description,
    input_schema: {
      type: 'object',
      properties: schema.parameters.properties as Record<string, unknown>,
      required: schema.parameters.required,
    },
  }
}

const SERVER_TOOLS = [
  {
    type: 'web_search_20250305' as const,
    name: 'web_search' as const,
    cache_control: { type: 'ephemeral' as const },
  },
]

function applyConversationCache(messages: Anthropic.MessageParam[]): void {
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const b of m.content) {
        if (b && typeof b === 'object' && 'cache_control' in b) {
          delete (b as { cache_control?: unknown }).cache_control
        }
      }
    }
  }
  if (messages.length === 0) return
  const last = messages[messages.length - 1]
  if (typeof last.content === 'string') {
    last.content = [
      {
        type: 'text',
        text: last.content,
        cache_control: { type: 'ephemeral' },
      },
    ]
  } else if (last.content.length > 0) {
    const lastBlock = last.content[last.content.length - 1]
    if (lastBlock && typeof lastBlock === 'object') {
      ;(lastBlock as { cache_control?: { type: 'ephemeral' } }).cache_control = {
        type: 'ephemeral',
      }
    }
  }
}

export const anthropicProvider: Provider = async (
  input: ProviderInput,
): Promise<ProviderResult> => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY тохируулагдаагүй.')

  const lastUser = [...input.history].reverse().find((m) => m.role === 'user')
  if (!lastUser) throw new Error('user мессеж олдсонгүй.')

  const startedAt = Date.now()
  const anthropic = new Anthropic({ apiKey })
  const model = pickModel(lastUser.content, input.context)

  const messages: Anthropic.MessageParam[] = input.history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: input.systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (input.contextBlock) {
    systemBlocks.push({ type: 'text', text: input.contextBlock })
  }

  const tools = [
    ...TOOL_SCHEMAS.map(toAnthropicTool),
    ...SERVER_TOOLS,
  ]

  const toolsExecuted: string[] = []
  let inputTokens = 0
  let outputTokens = 0
  let iterations = 0

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1
    applyConversationCache(messages)

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: systemBlocks,
      tools,
      messages,
    })

    if (response.usage) {
      inputTokens += response.usage.input_tokens
      outputTokens += response.usage.output_tokens
    }

    if (response.stop_reason === 'end_turn' || response.stop_reason !== 'tool_use') {
      if (response.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: response.content })
        continue
      }
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
        .trim()
      return {
        text: text || 'Уучлаарай, хариулт боловсруулж чадсангүй.',
        trace: {
          provider: 'anthropic',
          model,
          iterations,
          toolsExecuted,
          durationMs: Date.now() - startedAt,
          inputTokens,
          outputTokens,
        },
      }
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (tu) => {
        try {
          const result = await runTool(tu.name, tu.input)
          toolsExecuted.push(tu.name)
          return {
            type: 'tool_result',
            tool_use_id: tu.id,
            content: JSON.stringify(result),
          }
        } catch (e) {
          return {
            type: 'tool_result',
            tool_use_id: tu.id,
            content: `Tool алдаа: ${(e as Error).message}`,
            is_error: true,
          }
        }
      }),
    )

    messages.push({ role: 'user', content: toolResults })
  }

  return {
    text: 'Уучлаарай, хариулт боловсруулж чадсангүй (хэт олон iteration).',
    trace: {
      provider: 'anthropic',
      model,
      iterations,
      toolsExecuted,
      durationMs: Date.now() - startedAt,
      inputTokens,
      outputTokens,
    },
  }
}
