import Anthropic from '@anthropic-ai/sdk'
import {
  getBuildingInfo,
  type BuildingInfoInput,
} from './tools/get-building-info'
import {
  calculateMaterialNeeds,
  type CalcMaterialsInput,
} from './tools/calculate-material-needs'

const SYSTEM_PROMPT = `Чи бол "Байшин А-Я" туслах. Монголд байшингаа барих гэж буй хүнд төлөвлөх, материал сонгох, төсөв тооцоолох, БНбД ойлгох, мэргэжилтэн олох гэх мэт олон зүйлд тусалдаг.

# Стиль — амьд яриа

Хүнтэй ярилцаж буй мэт найрсаг, байгалийн хэлээр бич. "Та"-гаар эелдэг хандана. Хэт хатуу ёслолын хэллэгээс зайлсхий — туршлагатай нөхөр шиг ойр дотно ярь.

- Жижиг асуултад жижиг хариулт (1–3 өгүүлбэр). Том сэдэвт л дэлгэрэнгүй ор.
- Шаардлагагүй үед bullet, гарчиг бүү ашигла. Энгийн ярианд жирийн өгүүлбэрээр хариул.
- "Сайн байна уу!", "Маш сайн асуулт байна" гэх давтагдмал өрөлтөөс зайлсхий — шууд асуудал руу ор.
- Мэндэлбэл богинохон буцааж мэндэл, юу хийж чадахаа нэг өгүүлбэрээр товч хэл.
- Талархал бол богинохон хариу өг ("Зүгээр ээ, өөр тусалж болох зүйл байна уу?").
- Нөхцөл (талбай, бүс, төсөв) тодорхойгүй бол ТУХАЙН цэгийг л 1–2 асуултаар тодруул — бүгдийг нэг дор бүү асуу.
- Өмнөх ярианд хэлсэн зүйлийг санаж байгаагаа харуул ("Та өмнө 100 м² гэж хэлсэн тул...").
- Дэмжлэг үзүүлж бай — "Энэ нь түгээмэл хүндрэл, санаа зоволтгүй", "Сайхан төлөвлөж байна" гэх мэт хүний илэрхийлэл хэрэглэ.
- Заримдаа богино асуулт буцааж асуу ("Та хэдэн хүний гэр бүлд төлөвлөж байна вэ?") — энэ нь яриаг амьд болгоно.

# Хэрэгсэл сонгох дүрэм

1. **get_building_info** — БНбД, төсөл, roadmap, checklist хэрэгтэй бол ЭХЛЭЭД энийг туршина.
2. **calculate_material_needs** — тоосго, цемент, элс, бетон зэргийн ТООН тооцоонд ЗААВАЛ ашиглана. Бие даан тоо бодохгүй.
3. **web_search** — ЗӨВХӨН: одоогийн үнэ ханш, 2026 оны зах зээл, шинэ хууль/дүрэм, банкны хүү, URL эх сурвалж шаардсан асуулт. Ерөнхий зөвлөгөө, roadmap, математик тооцоонд БҮҮ ашигла.
4. Олон tool зэрэг хэрэгтэй бол паралл дуудна.

# Аюулгүй байдал

Даац, хийц бүтээц, суурийн нарийн тооцоо, газар хөдлөл тэсвэрлэлт, инженерийн баталгаатай холбоотой асуулт гарвал дараах анхааруулгыг оруул:

"⚠️ Энэ бол урьдчилсан төлөвлөлтийн тооцоо. Албан зураг төсөл болон даац/хийц бүтээцийн баталгаатай тооцоог мэргэжлийн инженерээр баталгаажуулна."

⚠️-г хэт олон давтахгүй — нэг ярианд нэг удаа л хангалттай. Энгийн ярианд тавих шаардлагагүй. Хариултаа "баталгаатай инженерийн тооцоо" гэж бүү танилцуул — энэ нь зөвхөн төлөвлөлтийн зөвлөгөө гэдгийг ил тод байлга.`

const getBuildingInfoTool: Anthropic.Tool = {
  name: 'get_building_info',
  description:
    'Supabase өгөгдлийн сангаас READ-ONLY горимоор төсөл, БНбД (барилгын норм), roadmap, checklist уншина. Хариу нь "found" талбартай — false бол өгөгдөл олдсонгүй гэсэн дохио.',
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['project', 'norm', 'roadmap', 'checklist'],
        description:
          'project=хэрэглэгчийн төсөл, norm=БНбД заалт, roadmap=алхамууд, checklist=шалгах жагсаалт',
      },
      query: {
        type: 'string',
        description: 'Хайлтын текст (norm-д ашиглана)',
      },
      project_id: {
        type: 'string',
        description: 'Тодорхой төсөл/roadmap/checklist унших бол ID',
      },
    },
    required: ['type'],
  },
}

const calculateMaterialNeedsTool: Anthropic.Tool = {
  name: 'calculate_material_needs',
  description:
    'Талбай (м²) ба ханын материал (тоосго/блок/каркас/бетон)-аар орцыг бодно. Pure математик функц. Үр дүн "ok:false" буцаавал input алдаатай.',
  input_schema: {
    type: 'object',
    properties: {
      area_m2: {
        type: 'number',
        description: 'Байшингийн талбай (м²). Жишээ: 8x10 = 80.',
      },
      material: {
        type: 'string',
        enum: ['brick', 'block', 'frame', 'concrete'],
        description: 'brick=тоосго, block=блок, frame=каркас, concrete=бетон',
      },
      height_m: {
        type: 'number',
        description: 'Ханын өндөр (м). Default 2.7. Хүчинтэй хязгаар: 1.8–6.',
      },
      wall_thickness_cm: {
        type: 'number',
        description: 'Ханын зузаан (см). Default 25. Хязгаар: 10–80.',
      },
      floors: {
        type: 'number',
        description: 'Давхрын тоо. Default 1. Хязгаар: 1–5.',
      },
    },
    required: ['area_m2', 'material'],
  },
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

async function runCustomTool(name: string, input: unknown): Promise<unknown> {
  if (name === 'get_building_info') {
    return await getBuildingInfo(input as BuildingInfoInput)
  }
  if (name === 'calculate_material_needs') {
    return calculateMaterialNeeds(input as CalcMaterialsInput)
  }
  throw new Error(`Unknown tool: ${name}`)
}

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

function pickModel(message: string, context: unknown): string {
  const defaultModel =
    process.env.ANTHROPIC_MODEL_DEFAULT || 'claude-sonnet-4-6'
  const strongModel = process.env.ANTHROPIC_MODEL_STRONG || 'claude-opus-4-7'

  const lower = message.toLowerCase()
  let strongHits = 0
  for (const kw of STRONG_KEYWORDS) {
    if (lower.includes(kw)) strongHits += 1
  }

  const looksLikeMultiTopic =
    /(?:цемент|тоосго|блок).+(?:үнэ|ханш|зах зээл)/i.test(message) ||
    /(?:үнэ|ханш).+(?:тооцоо|орц|материал)/i.test(message)
  if (looksLikeMultiTopic) strongHits += 1

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

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

const MAX_HISTORY_TURNS = 10

function buildContextBlock(context: unknown): string | null {
  if (!context || typeof context !== 'object') return null
  const json = JSON.stringify(context)
  if (json === '{}' || json === 'null') return null
  return `Хэрэглэгчийн төслийн нөхцөл (questionnaire г.м.):\n${json}\n\nЭнэ контекстийг хариулт өгөхдөө анхааралдаа авч, шаардлагагүй бол давтахгүй.`
}

const MAX_ITERATIONS = 5

type DebugTrace = {
  model: string
  iterations: number
  toolsRequested: string[]
  toolsExecuted: string[]
  webSearchUsed: boolean
  durationMs: number
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
}

export async function getAIReply(
  history: ChatTurn[],
  context: unknown,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY тохируулагдаагүй.')
  }

  if (history.length === 0) {
    throw new Error('Хоосон яриа.')
  }
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  if (!lastUser) {
    throw new Error('Хэрэглэгчийн мессеж олдсонгүй.')
  }

  const startedAt = Date.now()
  const isDev = process.env.NODE_ENV !== 'production'
  const trace: DebugTrace = {
    model: '',
    iterations: 0,
    toolsRequested: [],
    toolsExecuted: [],
    webSearchUsed: false,
    durationMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  }

  const anthropic = new Anthropic({ apiKey })
  const model = pickModel(lastUser.content, context)
  trace.model = model

  const trimmed = history.slice(-MAX_HISTORY_TURNS)
  const messages: Anthropic.MessageParam[] = trimmed.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const contextBlock = buildContextBlock(context)
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (contextBlock) {
    systemBlocks.push({ type: 'text', text: contextBlock })
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    trace.iterations = i + 1

    applyConversationCache(messages)

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: systemBlocks,
      tools: [getBuildingInfoTool, calculateMaterialNeedsTool, ...SERVER_TOOLS],
      messages,
    })

    if (response.usage) {
      trace.inputTokens += response.usage.input_tokens
      trace.outputTokens += response.usage.output_tokens
      trace.cacheCreationTokens +=
        response.usage.cache_creation_input_tokens ?? 0
      trace.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0
    }

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        trace.toolsRequested.push(block.name)
      } else if (block.type === 'server_tool_use' && block.name === 'web_search') {
        trace.webSearchUsed = true
        trace.toolsRequested.push('web_search')
      }
    }

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
        .trim()
      trace.durationMs = Date.now() - startedAt
      if (isDev) console.log('[ai/reply] trace:', trace)
      return text || 'Уучлаарай, хариулт боловсруулж чадсангүй.'
    }

    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content })
      continue
    }

    if (response.stop_reason !== 'tool_use') {
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
        .trim()
      trace.durationMs = Date.now() - startedAt
      if (isDev) console.log('[ai/reply] trace (non-end stop):', trace, 'stop_reason:', response.stop_reason)
      return text || 'Уучлаарай, хариулт үүсгэж чадсангүй.'
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (tu) => {
        try {
          const result = await runCustomTool(tu.name, tu.input)
          trace.toolsExecuted.push(tu.name)
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

  trace.durationMs = Date.now() - startedAt
  if (isDev) console.log('[ai/reply] trace (max iterations):', trace)
  return 'Уучлаарай, хариулт боловсруулж чадсангүй (хэт олон iteration).'
}
