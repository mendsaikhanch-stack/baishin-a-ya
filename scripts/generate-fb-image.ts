/**
 * Generate a Facebook promo image using Gemini Image generation.
 *
 * Run: npx tsx scripts/generate-fb-image.ts
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_API_KEY
if (!apiKey) {
  console.error('GOOGLE_API_KEY missing')
  process.exit(1)
}

const PROMPT = `Create a vibrant illustrated Facebook promo image, 1:1 square, in a friendly cartoon style.

Subject:
- A young Mongolian man, around 25-30 years old, with short black hair
- Wearing a YELLOW CONSTRUCTION HARD HAT (барилгын малгай) on his head
- Wearing a traditional Mongolian deel in deep blue with bright orange trim and traditional belt
- Cheerful expression, big smile, looking at viewer
- Holding a smartphone in one hand, pointing at the screen with the other

Background:
- Modern Mongolian residential buildings (apartment blocks) under construction in soft focus
- Light blue sky
- Warm, inviting color palette

Phone screen shows:
- A simple checklist UI with checkmarks (calculation results)

Text overlay (in MONGOLIAN CYRILLIC, large, bold, dark navy):
- Top-right speech bubble: "Байшингаа ухаалаг бариё"
- Below in smaller text: "Тооцоо, төлөвлөгөө, БНбД — бүгд нэг апп дээр"
- Orange CTA button at bottom: "Үнэгүй эхлэх"

Style:
- Flat illustration / modern cartoon
- Clean lines, vibrant colors
- Same visual style as the reference image (Mongolian community app promo)
- High-resolution, social-media ready
`

async function main() {
  const genAI = new GoogleGenerativeAI(apiKey!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
  })

  console.log('[gen] requesting image…')
  const result = await model.generateContent([{ text: PROMPT }])
  const response = result.response

  const parts = response.candidates?.[0]?.content?.parts ?? []
  let saved = 0
  for (const part of parts) {
    if ('inlineData' in part && part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      const out = `scripts/fb-image-${Date.now()}.png`
      writeFileSync(out, buffer)
      console.log(`[gen] ✓ saved → ${out} (${(buffer.length / 1024).toFixed(0)}KB)`)
      saved += 1
    } else if ('text' in part && part.text) {
      console.log('[gen] model commentary:', part.text.slice(0, 200))
    }
  }
  if (saved === 0) {
    console.error('[gen] no image returned. Full response:', JSON.stringify(response, null, 2).slice(0, 800))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('[gen] fatal:', e instanceof Error ? e.message : e)
  process.exit(1)
})
