import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `Чи Монголд өөрийн байшингаа барих гэж байгаа жирийн хүнд туслах төлөвлөлтийн зөвлөх.
Мэргэжлийн инженер, архитекторын зөвлөгөөг орлохгүй.
Хариултаа энгийн монгол хэлээр өг.
Аюулгүй байдалтай холбоотой асуудалд мэргэжилтэнд хандахыг зөвлө.`

export async function getAIReply(message: string, context: any) {
  const provider = process.env.AI_PROVIDER || 'anthropic'

  if (provider === 'anthropic') {
    return getAnthropicReply(message, context)
  }

  return getOpenAIReply(message, context)
}

async function getAnthropicReply(message: string, context: unknown): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Context: ${JSON.stringify(context)}\n\n${message}` },
    ],
  })

  return response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('\n') || 'Уучлаарай, хариулт үүсгэж чадсангүй.'
}

async function getOpenAIReply(message: string, context: unknown): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Context: ${JSON.stringify(context)}\n\n${message}` },
      ],
    }),
  })

  if (!res.ok) return getFallbackReply(message)

  const data = await res.json()
  return data.choices[0]?.message?.content || 'Уучлаарай, хариулт үүсгэж чадсангүй.'
}

function getFallbackReply(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('суурь'))
    return 'Суурийн сонголт газрын нөхцөлөөс хамаарна. Монголд хөлдөлтийн гүнийг (1.5-2.5м) заавал харгалзана. ⚠️ Суурийн тооцоог заавал бүтээцийн инженерээр хийлгэнэ үү.'
  if (lower.includes('материал') || lower.includes('тоосго') || lower.includes('блок'))
    return 'Тоосго — бат бөх, дулаалга сайн. Блок — хурдан, хямд. Каркас — хөнгөн, хурдан. Сонголт нь төсөв, бүс нутгаас хамаарна. ⚠️ Архитектортой зөвлөлдөөрэй.'
  if (lower.includes('төсөв') || lower.includes('зардал') || lower.includes('үнэ'))
    return '1м²-д ойролцоогоор 800,000-2,000,000₮. Нийт төсвийн 10-15%-ийг нөөцөд үлдээгээрэй. ⚠️ Нарийн тооцоог мэргэжлийн төсөвчнөөр гаргуулаарай.'
  if (lower.includes('зээл') || lower.includes('банк'))
    return 'Зээлийн сарын төлбөр орлогын 30%-аас хэтрэхгүй байх. Олон банкнаас үнийн санал авч харьцуулаарай. ⚠️ Санхүүгийн зөвлөгч авахыг зөвлөж байна.'

  return 'Байшин барилгатай холбоотой асуултаа илүү нарийвчилсан асуугаарай. ⚠️ Энэ бол ерөнхий мэдээлэл бөгөөд мэргэжлийн зөвлөгөөг орлохгүй.'
}
