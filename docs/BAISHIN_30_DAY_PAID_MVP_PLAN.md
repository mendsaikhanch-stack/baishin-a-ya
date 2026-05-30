# БОСГО — 30 хоногийн Paid MVP төлөвлөгөө

**Зорилго:** Landing → Questionnaire → Result Preview → **Manual Payment** → **Admin Unlock** → **PDF Report** урсгалыг бэлэн болгох.

**Гол үнийн санал (МВП):**
- **49,900₮** — Бүрэн PDF тайлан (9 шат, 30–50 даалгавар, эрсдэл, төсвийн задаргаа, материалын тооцоо, эксперт зөвлөмж)
- **99,000₮** — Premium (Pro asks + бэлэн материалын нэрс/нийлүүлэгчийн чиглүүлэг + chat-ийн нөөц)
- **199,000–299,000₮** — Хувийн зөвлөгөө (видео уулзалт, тусгай case-д тохируулсан)

**Disclaimer (хатуу мөр):**
> Энэхүү тайлан нь инженерийн зураг төсөл, мэргэжлийн төсөвчин, архитектор, барилгын инженерийн дүгнэлтийг орлохгүй. Зөвхөн эхний шатны төлөвлөлт, төсвийн баримжаа, эрсдэл ойлгох, ажлын дараалал гаргах зориулалттай.

Энэ текстийг `src/lib/constants.ts` дотор `DISCLAIMER_TEXT` болгож тавьж, landing footer, questionnaire submit screen, result preview, PDF cover хуудас 4 газарт **ил харагдуулах**.

---

## Долоо хоног 1 — Урсгалын суурийг угсрах (Day 1–7)

**Зорилго:** Хэрэглэгч асуумжийг бөглөөд preview-г хараад "сонирхож байна" гэвэл захиалга үүсгэх хүртэлх замыг бэлэн болгох.

### Day 1 — Тогтворжуулалт ба disclaimer
- Issue 3 fix: `results/page.tsx` Zustand hydration guard + questionnaire submit visible error
- `constants.ts` дотор `DISCLAIMER_TEXT`-г шинэчлэх (дээрх стандарт текст)
- Landing footer, questionnaire submit modal, results page disclaimer 4 газар ил харагдуулах
- **Files:** `src/lib/constants.ts`, `src/app/results/page.tsx`, `src/app/questionnaire/page.tsx`, `src/components/layout/Footer.tsx`

### Day 2 — Result preview-г баяжуулах
- Үнэгүй preview-д **нэмэх**:
  - Project type (frame/block/concrete) badge
  - Budget range: `₮X сая – ₮Y сая` (estimator-ыг preview-д дуудах)
  - Top 3 risks (бий, гэхдээ wording-ыг шалгах)
  - Next 3 actions (бий)
- "Дэлгэрэнгүй тайлан авах" CTA → `/checkout`-руу (доор шинээр)
- **Files:** `src/app/results/page.tsx`, ажиллахаар `runAssessment` + `estimate` нэгтгэх

### Day 3 — Захиалгын schema + Supabase migration
- Supabase-д шинэ table:
  ```sql
  create table report_orders (
    id uuid primary key default gen_random_uuid(),
    short_code text unique not null,         -- "BX-4FA9"
    email text not null,
    phone text,
    tier text not null check (tier in ('basic','premium','consult')),
    amount_mnt int not null,
    questionnaire jsonb not null,
    assessment jsonb not null,
    payment_method text default 'manual',
    payment_status text default 'pending',   -- pending|paid|cancelled|expired
    payment_reference text,                  -- bank transaction ID
    unlocked_at timestamptz,
    unlocked_by text,
    pdf_url text,
    created_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '14 days')
  );
  create index on report_orders (email);
  create index on report_orders (payment_status);
  ```
- RLS: зөвхөн service role унших/бичих
- Prisma schema-г шинэчилж sync хийх (эсвэл Supabase-only зам сонгох)
- **Files:** `supabase/migrations/0001_report_orders.sql`, `prisma/schema.prisma`

### Day 4 — `/checkout` route ба захиалга үүсгэх
- Шинэ хуудас `/checkout?tier=basic|premium|consult`
- Form: email, phone, tier; submit → `POST /api/orders/create`
- API: server-side `runAssessment` дуудаад захиалга бүртгэнэ, `short_code` буцаана
- **Files:** `src/app/checkout/page.tsx`, `src/app/api/orders/create/route.ts`, `src/lib/orders.ts`

### Day 5 — `/checkout/[code]` төлбөрийн зааварчилгаа хуудас
- Захиалгыг `short_code`-аар уншиж дараах мэдээллийг үзүүлнэ:
  - Захиалгын № (тод харагдсан), дүн, банк дансны зураг/QR код
  - "Гүйлгээний утга" гэдэг талбарт `short_code` бичих заавар
  - Төлбөр баталгаажтал ~24 цаг гэсэн SLA
  - "Төлбөр төлсөн" товчлуур → email-р админд мэдэгдэх (Resend эсвэл Supabase Edge Function)
- Status polling: `GET /api/orders/[code]/status` 30 сек тутамд
- **Files:** `src/app/checkout/[code]/page.tsx`, `src/app/api/orders/[code]/status/route.ts`

### Day 6 — Admin unlock UI suurь
- `/admin/orders` — Supabase admin auth (email allowlist)
- Захиалгын list: pending, paid, expired tab
- Захиалга бүрт: "Төлбөр баталгаажуулах" товч → `payment_status='paid'`, `unlocked_at`, `pdf_url` үүсгэх
- **Files:** `src/app/admin/orders/page.tsx`, `src/app/api/admin/orders/[code]/unlock/route.ts`, `src/middleware.ts` (admin-only protection)

### Day 7 — Manual smoke test
- Бүх flow-г end-to-end туршина (browser-аар): questionnaire → preview → checkout → admin unlock
- Зөвхөн mock төлбөрөөр (PDF одоохондоо хоосон placeholder)

---

## Долоо хоног 2 — PDF generator (Day 8–14)

**Зорилго:** 9-шатны бүрэн тайлан PDF-р үүсэх ёстой.

### Day 8 — PDF backend
- Install `@react-pdf/renderer` (server-side rendering, Node runtime)
- Тайлангийн template-ийн skeleton:
  - Cover page (нэр, огноо, disclaimer)
  - Section 1: Хэрэглэгчийн profile (questionnaire дэлгэрэнгүй)
  - Section 2: Readiness score + label
  - Section 3: Бюджет (range, breakdown by category)
  - Section 4: 9-шатны roadmap
  - Section 5: 30–50 даалгаврын checklist
  - Section 6: Эрсдэлүүд (full list)
  - Section 7: Мэргэжилтнүүдийн зөвлөмж (priority + timing)
  - Section 8: Pro questions (premium tier-д л)
  - Section 9: Disclaimer + холбоо барих мэдээлэл
- **Files:** `src/lib/pdf/report.tsx`, `src/lib/pdf/styles.ts`, `src/app/api/admin/orders/[code]/pdf/route.ts`

### Day 9 — PDF Section 1–3 (cover, profile, budget)
- Cover page + profile section + budget breakdown
- Estimator output-ыг task ангилал болгох (Газар, Барилгын ажил, Засал, Инженерийн систем, Тавилга, Нөөцийн сан)
- **Files:** `src/lib/pdf/sections/{cover,profile,budget}.tsx`

### Day 10 — PDF Section 4–5 (roadmap + checklist)
- Roadmap engine output-ыг яг тэр хэвээр гаргах
- 30–50 checklist item-г шат бүрээр groupping
- **Files:** `src/lib/pdf/sections/{roadmap,checklist}.tsx`

### Day 11 — PDF Section 6–9 (risks, experts, pro qs, disclaimer)
- Эрсдэл бүрд: title, description, level, suggestion
- Эксперт зөвлөмж бүрд: type, when, why
- Premium tier бол "Pro questions" — chat-аас 5–10 ширхэг чухал асуултын жагсаалт + бэлэн хариулт сэдэв
- **Files:** `src/lib/pdf/sections/{risks,experts,proquestions,disclaimer}.tsx`

### Day 12 — Storage + PDF download flow
- Үүсгэсэн PDF-г Supabase Storage `reports/` bucket-д хадгална
- Signed URL 7 хоног valid
- Захиалгын `pdf_url` талбарт хадгалах
- Admin unlock үед PDF generate + upload + email хэрэглэгчид
- **Files:** `src/lib/storage.ts`, `src/lib/email.ts` (Resend), `src/app/api/admin/orders/[code]/unlock/route.ts`

### Day 13 — Хэрэглэгчийн "Миний тайлан" хуудас
- `/r/[code]` route — захиалгын short_code-оор хандана
- pending бол: "Төлбөр баталгаажуулж байна..." статус
- paid бол: PDF татах товч + view link
- **Files:** `src/app/r/[code]/page.tsx`

### Day 14 — End-to-end test
- Бодит email-р manual flow туршина
- PDF cosmetic-уудыг засна

---

## Долоо хоног 3 — Premium + ажилбар (Day 15–21)

### Day 15–16 — Premium tier (99,000₮)
- Premium-ийн нэмэлт: pro questions section, илүү дэлгэрэнгүй material spec, chat-ийн 30 хоногийн нээлттэй access
- Chat-д захиалгын короод гарт `?code=XXX` параметрээр анхдагч контекст ачаалах
- `report_orders.tier='premium'` бол chat unlimited (rate-limit бууруулна)

### Day 17 — Consult tier (199–299k)
- "Хувийн уулзалт" — Calendly эсвэл Google Calendar холбох
- Захиалга нь paid болсны дараа admin унлоск UI-аас Calendly линк илгээх
- **Files:** `src/lib/calendly.ts` эсвэл manual scheduling form

### Day 18 — Хэрэглэгчийн profile mapping
- Email-ээр хэдэн ч захиалга үүссэн бол `/my-orders` хуудас (passwordless magic link, 1 удаагийн)
- Эсвэл: short_code-р email-руу илгээгдсэн линкээр хандах (хамгийн энгийн)

### Day 19 — Disclaimer + хуулийн текстийг бүх хэсэгт нэмэх
- Hero, Footer, Result page, PDF cover, Email template, Checkout consent checkbox
- Privacy & Terms-ийн товч хуудас (`/privacy`, `/terms`)

### Day 20–21 — Refinement + UX polish
- Mobile responsiveness шалгах
- Email template-уудын HTML
- Stripe код устгах (эсвэл feature-flag-аар нуух)

---

## Долоо хоног 4 — Production launch (Day 22–30)

### Day 22–23 — Бодит банкны данс ба QPay
- Эзний нэр дээр данс үүсгэх (хэрэв байхгүй бол)
- QPay эсвэл Khan/Golomt API integration-ийг **дараагийн** sprint-руу үлдээх — MVP-д зөвхөн manual bank transfer хангалттай
- Admin manual unlock-р дамжина

### Day 24 — Vercel production deploy
- Vercel project линк, env-ийг production-ийн нэрээр хуулах
- Supabase production project + migration push
- Domain тохируулах (`baishin.mn` эсвэл одоо байгаа)

### Day 25 — Закооны заавар + мэдээлэл
- Footer-т: компанийн нэр, регистр, имэйл, утас (заавал)
- Cookie banner (анхдагч level)

### Day 26 — Маркетингийн ажил
- Facebook page-руу 5 ширхэг promo зураг (одоо `OIG1*.jpg`-ийг ашиглах)
- Landing-аас Facebook track id (Pixel) суулгах

### Day 27 — Beta хэрэглэгч (5–10 хүн)
- Танил/гэр бүлээр test order оруулах
- Manual flow бодит ажиллаж байгааг харах

### Day 28–29 — Bug fix + content polish
- Beta-аас гарсан асуудлуудыг засна
- Хариу мэдээлэл (email тоо, хариу хугацаа)-ыг сайжруулна

### Day 30 — Public launch
- Facebook ad/пост, Instagram, Twitter-т зар тавих
- Эхний 24 цагт захиалгын дүн, хариу хугацаа, refund request-ыг хянана

---

## Эрсдэл & тэдгээрийн хяналт

| Эрсдэл | Магадлал | Үр дагавар | Тэмцэх арга |
|---|---|---|---|
| Manual unlock-аар админ хоцрох | Дунд | Хэрэглэгч сэтгэл нь хөдөлсөн үед нь нээж амжихгүй | SLA ил тавих (≤24 цаг), push notification админд |
| PDF UX / агуулга муу | Өндөр | Буцаан төлбөр нэхэх | Beta 5 хэрэглэгчийн PDF үнэлгээ +1 раунд rewrite |
| Disclaimer хангалтгүй | Өндөр | Хуулийн эрсдэл | 4 газарт ил харагдуулна + email-д + PDF cover-д |
| QPay/банк автоматжуулалт ороогүй | Дунд | Manual ажилбар бөглөгдөнө | MVP-д manual-аар, дараагийн sprint-д автомат |
| Prisma vs Supabase давхардал | Бага | Дата мисматч | Хоёрын аль нэгээр тогтоох — Supabase зайлсхийх боломжтой, ингэснээр Prisma-г устгах |

---

## "Ажиллахаа эхлэхэд" — эхний 3 хийх ёстой ажил

1. **Disclaimer текст шинэчлэх** + 4 газарт ил харагдуулах (~1 цаг)
2. **`/results` hydration race + visible error** засах (Issue 3) (~2 цаг)
3. **`report_orders` Supabase migration** + `/api/orders/create` route (~4 цаг)

Энэ 3 ажил хийгдмэгц дараагийн алхам нь `/checkout` UI болон admin unlock UI болно.

---

## Хүрвэл болохгүй scope (defer to v1.1)

- QPay/банк автомат webhook (manual unlock-р хангагдана)
- Хэрэглэгчийн нэвтрэлт (passwordless email link л хангалттай)
- Олон хэлний UI (англи мн зэрэгцэх)
- Affiliate / referral program
- Зөвлөгөө видео ярианы платформ (Calendly линкээр л хязгаарлана)
- Stripe sub model (бүхэлд нь устгах эсвэл feature-flag-аар нуух)
