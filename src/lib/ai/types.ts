export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export type ToolParamSchema = {
  type: 'string' | 'number' | 'integer' | 'boolean'
  description?: string
  enum?: string[]
}

export type ToolSchema = {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ToolParamSchema>
    required: string[]
  }
}

export type ProviderInput = {
  history: ChatTurn[]
  context: unknown
  systemPrompt: string
  contextBlock: string | null
}

export type ProviderTrace = {
  provider: string
  model: string
  iterations: number
  toolsExecuted: string[]
  durationMs: number
  inputTokens?: number
  outputTokens?: number
}

export type ProviderResult = {
  text: string
  trace: ProviderTrace
}

export type Provider = (input: ProviderInput) => Promise<ProviderResult>
