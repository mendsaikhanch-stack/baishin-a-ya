import Anthropic from '@anthropic-ai/sdk'
import {
  getBuildingInfo,
  type BuildingInfoInput,
} from './tools/get-building-info'
import {
  calculateMaterialNeeds,
  type CalcMaterialsInput,
} from './tools/calculate-material-needs'

const SYSTEM_PROMPT = `Чи Монголд байшингаа барих гэж буй хүнд туслах төлөвлөлтийн зөвлөх.

ХЭРЭГСЭЛ СОНГОХ ДҮРЭМ (Routing):

1. get_building_info — БНбД, төслийн өгөгдөл, roadmap, checklist хэрэгтэй бол ЭХЛЭЭД энийг туршина.
2. calculate_material_needs — тоосго, цемент, элс, бетон зэргийн ТООН тооцоонд ЗААВАЛ энийг ашиглана. Бие даан тооцож бүү бод.
3. web_search — ЗӨВХӨН доорх нөхцөлд ашиглана:
   • Одоогийн үнэ ханш ("одоогийн", "өнөөдрийн", "сүүлийн", "үнэ", "ханш" гэсэн үг орсон)
   • 2026 оны материалын үнэ
   • Шинэ хууль, дүрэм, стандарт
   • Зах зээлийн мэдээлэл, банкны хүү
   • URL эх сурвалж шаардсан асуулт

   web_search-ыг ДАРААХ үед БҮҮ ашигла:
   • Ерөнхий зөвлөгөө
   • roadmap/checklist (get_building_info-ыг туршина)
   • Материалын цэвэр математик тооцоо (calculate_material_needs-ыг ашигла)
   • get_building_info нь found:true буцаасан бол

4. Хэрэв олон tool нэгэн зэрэг хэрэгтэй бол паралл дуудаж болно.

АЮУЛГҮЙ БАЙДЛЫН ДҮРЭМ:

Доорх асуултад заавал анхааруулга өгнө:
• "яг баталгаатай тооцоо"
• "БНбД-ийн дагуу яг гарга"
• "суурь", "даац", "хийц бүтээц"
• "инженерийн баталгаа"

Эдгээр тохиолдолд хариултанд ЗААВАЛ дараах санааг оруул:
"⚠️ Энэ бол урьдчилсан төлөвлөлтийн тооцоо. Албан зураг төсөл, даац, хийц бүтээц, БНбД-ийн баталгаатай тооцоог мэргэжлийн инженерээр баталгаажуулна."

Хариултаа "баталгаатай инженерийн тооцоо" гэж бүү танилцуул — энэ нь зөвхөн төлөвлөлтийн зөвлөгөө гэдгийг тодорхой бич.

ХАРИУЛТЫН ХЭВ:
- Энгийн монгол хэлээр.
- Эх сурвалжаа дурд (БНбД дугаар, эсвэл интернет URL).
- Тооцоо хийсэн бол гол тоог тодорхой бич (м³, тонн, ширхэг).
- Мэргэжлийн инженер/архитекторын зөвлөгөөг орлохгүй гэдгийг сануул.`

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
  message: string,
  context: unknown,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY тохируулагдаагүй.')
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
  const model = pickModel(message, context)
  trace.model = model

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Context: ${JSON.stringify(context ?? {})}\n\nХэрэглэгчийн асуулт: ${message}`,
    },
  ]

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    trace.iterations = i + 1

    applyConversationCache(messages)

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
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
