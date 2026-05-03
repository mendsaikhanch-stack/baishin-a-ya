import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Schema,
} from '@google/generative-ai'
import type { Provider, ProviderInput, ProviderResult, ToolSchema, ToolParamSchema } from '../types'
import { TOOL_SCHEMAS, runTool } from '../tools'

const MAX_ITERATIONS = 5

function paramTypeToSchemaType(t: ToolParamSchema['type']): SchemaType {
  switch (t) {
    case 'string':
      return SchemaType.STRING
    case 'number':
      return SchemaType.NUMBER
    case 'integer':
      return SchemaType.INTEGER
    case 'boolean':
      return SchemaType.BOOLEAN
  }
}

function toGeminiFunctionDeclaration(schema: ToolSchema): FunctionDeclaration {
  const properties: Record<string, Schema> = {}
  for (const [key, p] of Object.entries(schema.parameters.properties)) {
    properties[key] = {
      type: paramTypeToSchemaType(p.type),
      description: p.description,
      ...(p.enum ? { enum: p.enum, format: 'enum' } : {}),
    } as Schema
  }
  return {
    name: schema.name,
    description: schema.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties,
      required: schema.parameters.required,
    },
  }
}

export const geminiProvider: Provider = async (
  input: ProviderInput,
): Promise<ProviderResult> => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY тохируулагдаагүй.')

  const startedAt = Date.now()
  const modelName = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.5-flash'

  const genAI = new GoogleGenerativeAI(apiKey)

  const systemInstructionText = input.contextBlock
    ? `${input.systemPrompt}\n\n---\n\n${input.contextBlock}`
    : input.systemPrompt

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstructionText,
    tools: [
      {
        functionDeclarations: TOOL_SCHEMAS.map(toGeminiFunctionDeclaration),
      },
    ],
  })

  const contents: Content[] = input.history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const toolsExecuted: string[] = []
  let inputTokens = 0
  let outputTokens = 0
  let iterations = 0

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1
    const result = await model.generateContent({ contents })
    const response = result.response

    if (response.usageMetadata) {
      inputTokens += response.usageMetadata.promptTokenCount ?? 0
      outputTokens += response.usageMetadata.candidatesTokenCount ?? 0
    }

    const fnCalls = response.functionCalls() ?? []

    if (fnCalls.length === 0) {
      const text = response.text().trim()
      return {
        text: text || 'Уучлаарай, хариулт боловсруулж чадсангүй.',
        trace: {
          provider: 'gemini',
          model: modelName,
          iterations,
          toolsExecuted,
          durationMs: Date.now() - startedAt,
          inputTokens,
          outputTokens,
        },
      }
    }

    contents.push({
      role: 'model',
      parts: fnCalls.map((fc) => ({ functionCall: fc })),
    })

    const fnResponses = await Promise.all(
      fnCalls.map(async (fc) => {
        try {
          const out = await runTool(fc.name, fc.args)
          toolsExecuted.push(fc.name)
          const wrapped =
            out && typeof out === 'object' && !Array.isArray(out)
              ? (out as Record<string, unknown>)
              : { result: out }
          return {
            functionResponse: {
              name: fc.name,
              response: wrapped,
            },
          }
        } catch (e) {
          return {
            functionResponse: {
              name: fc.name,
              response: { error: (e as Error).message },
            },
          }
        }
      }),
    )

    contents.push({
      role: 'user',
      parts: fnResponses,
    })
  }

  return {
    text: 'Уучлаарай, хариулт боловсруулж чадсангүй (хэт олон iteration).',
    trace: {
      provider: 'gemini',
      model: modelName,
      iterations,
      toolsExecuted,
      durationMs: Date.now() - startedAt,
      inputTokens,
      outputTokens,
    },
  }
}
