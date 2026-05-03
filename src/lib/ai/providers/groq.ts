import Groq from 'groq-sdk'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
} from 'groq-sdk/resources/chat/completions'
import type { Provider, ProviderInput, ProviderResult, ToolSchema } from '../types'
import { TOOL_SCHEMAS, runTool } from '../tools'

const MAX_ITERATIONS = 5

function toGroqTool(schema: ToolSchema): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: schema.name,
      description: schema.description,
      parameters: {
        type: 'object',
        properties: schema.parameters.properties as Record<string, unknown>,
        required: schema.parameters.required,
      },
    },
  }
}

export const groqProvider: Provider = async (
  input: ProviderInput,
): Promise<ProviderResult> => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY тохируулагдаагүй.')

  const startedAt = Date.now()
  const modelName =
    process.env.GROQ_MODEL_DEFAULT || 'llama-3.3-70b-versatile'

  const groq = new Groq({ apiKey })

  const systemContent = input.contextBlock
    ? `${input.systemPrompt}\n\n---\n\n${input.contextBlock}`
    : input.systemPrompt

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...input.history.map<ChatCompletionMessageParam>((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  const tools = TOOL_SCHEMAS.map(toGroqTool)

  const toolsExecuted: string[] = []
  let inputTokens = 0
  let outputTokens = 0
  let iterations = 0

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 4096,
    })

    if (completion.usage) {
      inputTokens += completion.usage.prompt_tokens
      outputTokens += completion.usage.completion_tokens
    }

    const choice = completion.choices[0]
    const msg = choice.message
    const toolCalls = msg.tool_calls ?? []

    if (toolCalls.length === 0) {
      const text = (msg.content ?? '').trim()
      return {
        text: text || 'Уучлаарай, хариулт боловсруулж чадсангүй.',
        trace: {
          provider: 'groq',
          model: modelName,
          iterations,
          toolsExecuted,
          durationMs: Date.now() - startedAt,
          inputTokens,
          outputTokens,
        },
      }
    }

    messages.push({
      role: 'assistant',
      content: msg.content ?? '',
      tool_calls: toolCalls,
    })

    await Promise.all(
      toolCalls.map(async (tc: ChatCompletionMessageToolCall) => {
        let parsed: unknown = {}
        try {
          parsed = JSON.parse(tc.function.arguments || '{}')
        } catch {
          // keep as empty
        }
        let resultContent: string
        try {
          const out = await runTool(tc.function.name, parsed)
          toolsExecuted.push(tc.function.name)
          resultContent = JSON.stringify(out)
        } catch (e) {
          resultContent = JSON.stringify({ error: (e as Error).message })
        }
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: resultContent,
        })
      }),
    )
  }

  return {
    text: 'Уучлаарай, хариулт боловсруулж чадсангүй (хэт олон iteration).',
    trace: {
      provider: 'groq',
      model: modelName,
      iterations,
      toolsExecuted,
      durationMs: Date.now() - startedAt,
      inputTokens,
      outputTokens,
    },
  }
}
