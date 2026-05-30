# БОСГО Estimator SaaS

Mongolia-based house construction cost estimator with Stripe monetization, Supabase backend, Next.js frontend, and an AI assistant layer (Claude / Gemini).

**Live demo:** https://baishin-a-ya.vercel.app

---

## What it does

- Estimates total cost, duration, and material breakdown for a house given size, floors, type, quality, location, and (optionally) season.
- Returns RANGES, never single exact prices.
- AI assistant parses Mongolian natural-language requests and explains results — but never computes prices itself.
- BNbD (Mongolia building code) chunks indexed in Supabase for AI to cite.

---

## Repository structure

```
src/
├── app/
│   ├── page.tsx                                  landing
│   ├── chat/page.tsx                             AI chat (multi-turn)
│   ├── pricing/page.tsx                          Free vs Pro, Stripe checkout
│   ├── login/page.tsx                            Supabase magic link
│   ├── account/page.tsx                          plan + daily quota
│   ├── auth/
│   │   ├── callback/route.ts                     code → session exchange
│   │   └── sign-out/route.ts
│   └── api/
│       ├── chat/route.ts                         public AI chat
│       ├── internal/estimate/route.ts            secret-gated estimator
│       ├── admin/recalibrate/route.ts            admin-only price update
│       └── stripe/
│           ├── create-checkout-session/route.ts
│           └── webhook/route.ts
├── components/
│   ├── EstimatorForm.tsx
│   ├── ResultCard.tsx
│   └── StripeButton.tsx
├── lib/
│   ├── estimator/                                pure-function engine
│   │   ├── types.ts
│   │   ├── data.ts                               PRICE/MATERIAL/SEASON tables
│   │   ├── index.ts                              estimate(), validateInput()
│   │   ├── recalibrate.ts                        admin price-version update
│   │   └── logging.ts                            estimate_logs writer
│   ├── ai/
│   │   ├── reply.ts                              provider router
│   │   ├── system-prompt.ts                      system prompt + context builder
│   │   ├── tools/                                estimate_house, get_building_info,
│   │   │                                         calculate_material_needs
│   │   └── providers/                            anthropic, gemini, groq
│   ├── supabase-server.ts                        SSR client
│   ├── supabase-client.ts                        browser client
│   └── rate-limit.ts                             Upstash Redis IP throttle
└── middleware.ts                                 /account auth gate

supabase/
├── 01-create-content-articles.sql                BNbD storage
├── 02-create-estimate-logs.sql                   per-call audit
├── 03-seed-pricing.sql                           v1 Mongolia 2026 prices
├── 04-create-saas-tables.sql                    users + price_table +
│                                                 multipliers + material_table +
│                                                 duration_table + recalibration_log
└── seed-content-articles.sql

scripts/
└── ingest-bnbd.ts                                PDF/DOCX → Supabase ingester
                                                  (Gemini OCR fallback for scans)
```

---

## Tech stack

- **Next.js 14** (App Router) on **Vercel**
- **TypeScript** strict
- **Tailwind CSS**
- **Supabase** Postgres + Auth + RLS
- **Stripe** subscriptions
- **AI**: Anthropic Claude (preferred), Google Gemini (free fallback), Groq Llama (free fallback)
- **Upstash Redis** for rate limiting

---

## Local setup

```bash
# 1. Clone
gh repo clone mendsaikhanch-stack/baishin-a-ya
cd baishin-a-ya
npm install

# 2. Env
cp .env.example .env.local
# Fill in values — see "Environment variables" below

# 3. Run Supabase schema (in SQL Editor or psql)
psql "$SUPABASE_DB_URL" < supabase/01-create-content-articles.sql
psql "$SUPABASE_DB_URL" < supabase/02-create-estimate-logs.sql
psql "$SUPABASE_DB_URL" < supabase/04-create-saas-tables.sql
psql "$SUPABASE_DB_URL" < supabase/03-seed-pricing.sql

# 4. Dev server
npm run dev
# → http://localhost:3000
```

---

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # SERVER-ONLY, never expose

# AI providers (at least one required)
AI_PROVIDER=gemini                      # or anthropic / groq
AI_FALLBACK_PROVIDERS=groq,anthropic    # comma-separated, optional
GOOGLE_API_KEY=AIza...                  # https://aistudio.google.com/apikey (free)
GROQ_API_KEY=gsk_...                    # https://console.groq.com/keys (free)
ANTHROPIC_API_KEY=sk-ant-...            # https://console.anthropic.com (paid)
GEMINI_MODEL_DEFAULT=gemini-2.5-flash
ANTHROPIC_MODEL_DEFAULT=claude-sonnet-4-6
ANTHROPIC_MODEL_STRONG=claude-opus-4-7

# Rate limiting (Upstash Redis, free)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXX...

# Internal estimator API
INTERNAL_API_SECRET=                    # openssl rand -hex 32

# Stripe (Pro subscription)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# Admin
ADMIN_EMAIL=you@example.com             # who can call /api/admin/recalibrate

# App URL (used by Stripe success/cancel and chat tool)
APP_URL=http://localhost:3000           # production: https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=БОСГО
```

---

## Production deployment

### 1. Supabase

1. Create project at https://supabase.com
2. SQL Editor → run `01..04` SQL files in order
3. Auth → Providers → enable **Email** (magic link)
4. Auth → URL Configuration → Site URL = `https://your-app.vercel.app`

### 2. Stripe

1. Dashboard → Products → create "Pro" with monthly recurring price ($9.99 USD)
2. Copy `price_xxx` → `STRIPE_PRO_PRICE_ID`
3. Webhooks → Add endpoint:
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### 3. Upstash Redis

1. https://upstash.com → Create Database → Regional, free tier
2. Copy REST URL + Token

### 4. AI keys

1. Gemini (free): https://aistudio.google.com/apikey
2. Groq (free): https://console.groq.com/keys
3. Anthropic (paid, optional): https://console.anthropic.com/settings/keys

### 5. Vercel

```bash
npm i -g vercel
vercel login
vercel link
# Add ALL env vars above via Vercel dashboard or `vercel env add KEY production`
vercel --prod
```

### 6. Smoke test

```bash
SECRET="$(grep INTERNAL_API_SECRET .env.local | cut -d= -f2)"
curl -X POST https://your-app.vercel.app/api/internal/estimate \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: $SECRET" \
  -d '{"size_m2":120,"floors":2,"location":"city","quality":"medium","type":"block"}'
```

---

## Estimator engine

```ts
import { estimate } from "@/lib/estimator";

const out = estimate({
  size_m2: 120, floors: 2, location: "city", quality: "medium", type: "block",
});
// out.price_total: { min, max }
// out.price_total_with_margin: { min, max }   (profit + contingency + VAT)
// out.duration_months: { min, max }
// out.materials_top5: [{ name, share, cost: { min, max } }]
// out.season_applied: { season, multiplier }
```

Calculation: `base × floor_mul × location_mul × season_mul × (1 ± 15%)`.
Margins: profit (15%) → contingency (10%) → VAT (10%), each compounded.

---

## AI integration

### Flow

```
User text  ──►  Chat AI
                │
                ├── parse_estimate_input(text)         ─► { size_m2, floors, ... }
                │
                ├── estimate_house(parsed)              ─► EstimateOutput JSON
                │      └── invokes internal estimator
                │
                ├── advisor(EstimateOutput)             ─► { summary, suggestion, warning }
                │
                └─► User sees: range, duration, materials, advisor text
```

### Tool definitions (in `src/lib/ai/tools/index.ts`)

- `estimate_house(size_m2, floors, location, quality, type)` — full house cost
- `calculate_material_needs(area_m2, material, ...)` — wall material counts
- `get_building_info(type, query, project_id)` — Supabase BNbD lookup

### Strict rules in system prompt

- AI MUST call `estimate_house` for any whole-house cost question — never compute prices.
- AI MUST NOT reveal `price_table`, multipliers, or formulas.
- AI MUST NOT claim "engineer-verified".
- For BNbD / structural / safety questions: include preliminary-planning ⚠️ disclaimer.

### Plan gating

- **Free**: top 2 materials, no margins, no advisor, 3 estimates/day.
- **Pro**: full result, AI advisor, all 5 materials, full margin breakdown, unlimited.

---

## Public vs internal

| | Public user | Internal / Admin |
|---|---|---|
| Price range | ✅ | ✅ |
| Duration | ✅ | ✅ |
| Materials top 5 | ✅ (Pro) / top 2 (Free) | ✅ |
| Margins breakdown | ✅ (Pro only) | ✅ |
| AI advisor | ✅ (Pro only) | ✅ |
| Raw price_table | ❌ | ✅ via `recalibratePrices()` |
| Multipliers | ❌ | ✅ via SQL |
| Estimate logs | ❌ | ✅ `estimate_logs` table |
| Recalibration history | ❌ | ✅ `recalibration_log` table |

---

## BNbD ingestion (knowledge base)

```bash
npx tsx scripts/ingest-bnbd.ts "31-01-10" scripts/pdfs/bnbd-31-01-10.pdf
# Or with .docx
npx tsx scripts/ingest-bnbd.ts "81-02-21" scripts/pdfs/bnbd-81-02-21.docx
```

Scanned PDFs auto-fall-back to Gemini OCR (page-by-page) using your `GOOGLE_API_KEY`.

---

## Disclaimer

⚠️ This app provides preliminary planning estimates only. Official quantity surveys, structural calculations, and BNbD verification must be done by licensed engineers and architects.
