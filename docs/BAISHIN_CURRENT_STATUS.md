# Байшин А-Я — Аудитын тайлан (Current Status)

**Огноо:** 2026-05-16 (MVP foundation fixes сэшний дараа)
**Хувилбар:** v0.1.0
**Эх кодын байдал:** ажиллах, build амжилттай, lint цэвэр

---

## 🆕 2026-05-16 (8) — Resend email integration

### Шинээр нэмэгдсэн
- **`resend`** dependency суусан.
- **`src/lib/email.ts`** — server-only:
  - `sendOrderPaidEmail(order)` — "Төлбөр баталгаажлаа" mail (захиалгын хуудсанд линктэй)
  - `sendOrderUnlockedEmail(order)` — "Тайлан бэлэн боллоо" mail
  - HTML + text аль аль хэлбэртэй; XSS-аас сэргийлж input-уудыг escape
  - Resend response error-ыг шалгана, exception catch хийнэ
- **`/api/admin/orders/[code]/status`** route шинэ зан үйл:
  - `customer_email`, `customer_name` гаргахаар фетч-ыг өргөтгөсөн
  - `paid` шилжилт → `sendOrderPaidEmail` (best-effort)
  - `unlocked` + PDF амжилттай үүссэн → `sendOrderUnlockedEmail`
  - Response-д `email: { sent, id }` эсвэл `email: { sent: false, reason, error? }` талбар нэмэгдсэн
- **Admin UI** одоо PDF болон email-ийн алдааг хосолсон amber warning-аар харуулдаг:
  - `no_recipient` → "Хэрэглэгчийн email бүртгэгдээгүй"
  - `no_config` → "RESEND_API_KEY тохируулагдаагүй"
  - `send_failed` → Resend-ийн алдааны мессеж

### Env
- `.env.example`-д:
  - `RESEND_API_KEY=` (хоосон бол email no-op)
  - `RESEND_FROM_EMAIL="Байшин А-Я <noreply@baishin.mn>"`
  - `APP_URL=http://localhost:3000` (email линкэнд)

### Дизайн
- **Best-effort:** email алдаа гарвал status шилжилт буцаахгүй
- Email линк нь signed URL биш — `/orders/[code]` хуудас руу ордог. Тэндээс "Тайлан татах" дарвал шинэ 1 цагийн signed URL шууд авна (email хугацаа дуусахгүй, хэдэн ч удаа татаж болно)
- `customer_email` байхгүй захиалгуудад no-op (form-д email сонголттой)
- Manual PDF regeneration (PdfPanel) email явуулахгүй — admin өөрөө email явуулах боломжтой

---

## 🆕 2026-05-16 (7) — Unlock action нь PDF-ыг автоматаар үүсгэдэг болсон

### Шинээр нэмэгдсэн
- **`src/lib/report-pdf-pipeline.ts`** — `generateAndStoreReportPDF(supabase, order)` гэсэн нэгдсэн pipeline. Render → upload → DB update-ыг нэг функц дотор багтаасан. Алдааны код: `render_error|storage_error|db_error`.
- `/api/admin/orders/[code]/pdf/route.ts` болон `/api/admin/orders/[code]/status/route.ts` хоёр route одоо нэг шилбээс хэрэглэнэ.

### Шинэ зан үйл
- **Admin "Нээх + PDF" товч** дармагц `/api/admin/orders/[code]/status` route:
  1. Status-ыг `paid → unlocked`-руу шилжүүлнэ
  2. `unlocked_at` бичнэ
  3. Захиалгын `project_snapshot` авна
  4. `generateAndStoreReportPDF()` дуудна (render + upload + pdf_path хадгална)
- **Best-effort:** PDF үүсгэхэд алдаа гарвал unlock-ыг буцаахгүй. Захиалга `unlocked` хэвээр үлдэх ба admin "PDF дахин үүсгэх" товчоор гар аргаар үүсгэх боломжтой.
- Status route-ийн response:
  ```json
  { "ok": true, "order_code": "BA-...", "status": "unlocked", "from": "paid",
    "pdf": { "generated": true, "pdf_path": "...", "size_bytes": 12345 } }
  ```
  Алдаатай үед: `"pdf": { "generated": false, "error": "...", "code": "render_error" }`

### UI өөрчлөлт
- Admin товчны нэр "Нээх" → **"Нээх + PDF"** болсон (мөн `title` tooltip)
- Confirm dialog: "Захиалгыг нээж PDF үүсгэх үү? Энэ үйлдэл буцаагдахгүй."
- Partial-success amber warning банneр нэмэгдсэн (PDF үүсгэхэд алдаа гарвал)
- `PdfPanel` хэвэндээ үлдсэн боловч одоо **regenerate / fallback** болсон:
  - PDF бий бол: цагаан "PDF дахин үүсгэх" товч (secondary style)
  - PDF алга бол: brand-цэнхэр "PDF үүсгэх" товч + амбер "Unlock үед үүсээгүй — дахин үүсгэх шаардлагатай" hint
- `/status` route-д `maxDuration = 60` тавьсан (PDF рендер + upload амжилттай явахын тулд)

---

## 🆕 2026-05-16 (6) — Launch quality улсхил

### Шинээр нэмэгдсэн
- **`src/lib/estimate-preview.ts`** — `buildProjectPreview(questionnaire)` нь questionnaire-аас estimator engine руу зууж `{ projectTypeLabel, estimatorType, budgetMin, budgetMax, durationMonthsMin, durationMonthsMax }` буцаана. `/results` болон PDF аль аль нь ижил эх үүсвэрээс утгуудыг авна. `formatMnt()` — "₮96M" → "96 сая ₮" формат.
- **/results preview card нэмэгдсэн** — score-н доор шинэ "Таны төслийн анхны баримжаа" хэсэгт: project type (preferredMaterial-аас уламжилсан label) + тооцоолсон төсвийн муж (сая ₮-ээр) + амбер caveat: "анхны баримжаа, албан ёсны төсөв биш".
- **PDF `ProjectTypeBudgetSection` шинэчлэгдсэн** — одоо `buildProjectPreview` ашигладаг. Хүснэгтэд: төрөл, тооцоолсон төсвийн муж, хэрэглэгчийн зорилт, тооцоолсон хугацаа, санал болгож буй зам. Section title-аас "(баримжаа)" гэсэн тэмдэглэгээ + интро мөр.

### PDF font/CDN risk fix
- **Google Fonts `gstatic.com` URL-уудыг бүрэн устгасан.** Runtime/build-д гадаад CDN-ээс хамаарахгүй болсон.
- `src/lib/report-pdf.tsx` дотор `node:fs.existsSync()`-р локал TTF файлуудыг шалгана:
  - `public/fonts/NotoSans-Regular.ttf`
  - `public/fonts/NotoSans-Bold.ttf`
- Файл бий бол `ReportFont` нэрээр Font.register, styles-д `fontFamily: "ReportFont"` хэрэглэнэ
- Файл байхгүй бол console warning + Helvetica-руу унана (Cyrillic зөв харагдахгүй)
- **Required font path** (admin-аар бэлдэх): хэрэглэгч NotoSans-ын Cyrillic subset татах (https://fonts.google.com/noto/specimen/Noto+Sans) → 2 файлыг дээрх замд commit. Файл репорт-д хадгалагдаагүй болохоор admin тус тусын font нэмж commit хийнэ.

### Disclaimer visibility verify (6 газар)
- ✅ Landing → `Footer.tsx` (Footer бүх хуудсанд харагдана)
- ✅ Questionnaire submit → `questionnaire/page.tsx` (step 4-ийн төгсгөлд amber banner)
- ✅ Results → `results/page.tsx` (хуудасны доор `assessment.disclaimer`-р дамжуулан)
- ✅ Checkout → `checkout/[tier]/page.tsx` (доор amber banner)
- ✅ Order page → `orders/[code]/page.tsx` (доор amber banner)
- ✅ Pricing → `pricing/page.tsx` (бонус)
- ✅ PDF → `report-pdf.tsx` (page 1 + page 3 двух удаа)

### Build/Lint
- `next lint` — 0 warnings, 0 errors
- `next build` — 28 routes prerender амжилттай
- /results bundle 6.83 → 8.64 kB (estimator integration)

---

## 🆕 2026-05-16 (5) — PDF report skeleton

### Шинээр нэмэгдсэн
- **`supabase/06-add-report-pdf.sql`** — `report_orders` дотор `pdf_path`, `pdf_generated_at` багана нэмсэн + `report-pdfs` private storage bucket үүсгэсэн (no policies, service-role only). Idempotent.
- **`@react-pdf/renderer`** dependency суусан.
- **`src/lib/report-pdf.tsx`** — server-only PDF generator. Roboto-г Google Fonts gstatic CDN-аас бүртгэсэн (Cyrillic дэмждэг). `renderReportPDF(input): Promise<Buffer>` API.
- **`src/app/api/admin/orders/[code]/pdf/route.ts`** — `POST` admin-only. status=unlocked байх ёстой. Render → upload `report-pdfs/[code].pdf` (upsert) → `pdf_path` + `pdf_generated_at` хадгална.
- **`src/app/api/orders/[code]/download/route.ts`** — `GET` public. Зөвхөн status=unlocked + pdf_path-тэй захиалгад 1 цагийн `createSignedUrl` үүсгэж буцаана.
- **Admin UI update** — unlocked захиалга бүрд `PdfPanel`: "PDF үүсгэх / дахин үүсгэх" товч + үүсгэсэн огноо + амжилт/алдаа inline alert.
- **Order UI update** — `/orders/[code]` дээр status=unlocked үед `DownloadPanel`: ногоон Тайлан татах товч → `/download` дуудах → шинэ tab-д signed URL нээнэ.

### PDF sections (3 хуудас)
- Page 1: гарчиг + захиалгын мета (code/огноо/багц) → disclaimer → төслийн товч мэдээлэл (questionnaire) → бэлэн байдлын оноо → төрөл/төсөв → эрсдэлүүд → дараагийн алхмууд
- Page 2: 9-шаттай roadmap (шинж бүрд title + duration + task count + expert type) → checklist (category-аар бүлэглэсэн, checkbox)
- Page 3: мэргэжилтнээс асуух 3 төрлийн pro questions (Архитектор / Бүтээцийн инженер / Гүйцэтгэгч) → disclaimer
- Footer бүх хуудсанд: `Байшин А-Я · order_code · X / 3`

### Тэмдэглэл
- PDF дотор Cyrillic харагдах нь Google Fonts gstatic.com-оос Roboto-г сервер талаас татаж бүртгэсэнтэй холбоотой. Боломжтой алба нь self-hosted TTF.
- `unlock` товч дармагц PDF автоматаар үүсэхгүй — admin тусад нь "PDF үүсгэх" товч дарна. Дараагийн refinement: unlock action-д PDF generation-ыг chain-лэх.

---

## 🆕 2026-05-16 (4) — Admin order review + manual unlock

### Шинээр нэмэгдсэн
- **`src/lib/admin-auth.ts`** — `requireAdmin()` helper. Одоо байгаа Supabase auth + `ADMIN_EMAIL` env pattern-ыг (анхнаасаа `/api/admin/recalibrate`-д inline байсан) дахин ашиглаж байна. Шинэ token gate **нэмээгүй** — одоо байгаа admin auth (Supabase user.email === ADMIN_EMAIL)-г ашиглав.
- **`src/app/api/admin/orders/route.ts`** — `GET` бүх захиалгын жагсаалт:
  - `requireAdmin()` дамжуулаагүй бол 401 (unauthenticated) / 403 (not_admin)
  - Query param: `status` (filter), `limit` (default 50, max 200)
  - Хариу талбарууд: `order_code`, `tier`, `price_mnt`, `status`, `customer_*`, `payment_note`, `admin_note`, `created_at`, `updated_at`, `unlocked_at`
  - **`project_snapshot` буцаагаагүй** (PDF route ирэх sprint-д)
- **`src/app/api/admin/orders/[code]/status/route.ts`** — `POST` төлвийн шилжилт:
  - State machine: `pending_payment → paid|cancelled`, `paid → unlocked|cancelled`, `unlocked|cancelled` нь terminal
  - Хүчингүй шилжилтэд 409 `invalid_transition`, same-status дээр 409 `no_change`
  - `status = unlocked` болоход `unlocked_at = now()`
  - `admin_note` нь overwrite биш — `[ISO admin@email] note\n…` форматтай append
- **`src/app/admin/orders/page.tsx`** — UI:
  - Authstate шалгалт: 401 → "/login?next=/admin/orders" CTA, 403 → "Хандалт хориглогдсон"
  - Filter chips: бүгд / хүлээгдэж буй / төлсөн / нээгдсэн / цуцлагдсан
  - Card бүрд: код+copy, status badge, төсөв, customer contact (`tel:`/`mailto:` link), payment_note + admin_note (expandable), admin_note textarea, шилжилтийн товч (Mark paid / Unlock / Cancel) — STATUS_TRANSITIONS-аар динамик; "Unlock" болон "Cancel" дээр confirm dialog
- **`src/lib/orders.ts`-д шинэ export:** `VALID_STATUSES`, `STATUS_TRANSITIONS`, `STATUS_LABELS`
- **`.env.example`-д** `ADMIN_EMAIL` баримтжуулсан (README-д аль хэдийн байсан).

### Auth pattern
- Энэ feature нь шинэ token нэмээгүй — одоо байгаа Supabase auth-ыг ашиглаж байна
- Admin нь `/login`-р OTP-р нэвтэрсний дараа `ADMIN_EMAIL`-тэй email нь таарвал л API-руу хандана
- `requireAdmin()` нь `unauthenticated|not_admin` гэсэн reason-той тодорхой объект буцаадаг
- Бүх admin API route нь service-role Supabase client-р DB-руу бичдэг (RLS bypass)

### Бий болсон flow
```
Хэрэглэгч: /pricing → /checkout/[tier] → /api/orders/create → /orders/[code] → notify
Админ:    /login → /admin/orders → Mark paid → Unlock (status=unlocked, unlocked_at=now)
```
*(PDF generation болон email илгээх нь дараагийн sprint-ийн scope.)*

---

## 🆕 2026-05-16 (3) — Manual checkout UI

### Шинээр нэмэгдсэн
- `src/app/checkout/[tier]/page.tsx` — tier-validate, hydration guard, customer form, `assessment` шаардана, submit → `/api/orders/create` → redirect `/orders/[code]`
- `src/app/orders/[code]/page.tsx` — захиалга харах, банкны заавар (гүйлгээний утга = order_code), `payment_note` илгээх textarea
- `src/app/api/orders/[code]/route.ts` — `GET` safe public order info (project_snapshot, notes нуугдмал)
- `src/app/api/orders/[code]/notify/route.ts` — payment_note timestamp-той append, status өөрчлөгдөхгүй
- `src/lib/orders.server.ts` — `generateOrderCode` server-only (node:crypto client bundle алдаа арилгасан)
- `src/lib/orders.ts` — `ORDER_CODE_RE`, `CODE_ALPHABET` export
- `src/app/pricing/page.tsx` — Stripe sub flow устаж, 4 plan-тай (free + 3 tier) болсон, server component

---

## 🆕 2026-05-16 (2) — Paid report order foundation

Захиалгын суурь (UI, admin, PDF үгүй — зөвхөн DB + create endpoint):

### Шинээр нэмэгдсэн
- **`supabase/05-create-report-orders.sql`** — `report_orders` table:
  - Багана: `id`, `order_code` (unique), `tier` (`full_pdf|premium|consultation`), `price_mnt`, `status` (`pending_payment|paid|unlocked|cancelled`), `customer_name/phone/email`, `project_snapshot jsonb not null`, `payment_note`, `admin_note`, `unlocked_at`, `created_at`, `updated_at`
  - Index: `status`, `created_at desc`, `customer_email (where not null)`
  - Trigger: `set_report_orders_updated_at()` → `updated_at` авто
  - **RLS** идэвхтэй, **policy үүсгээгүй** — anon/authenticated роль ямар ч хандалтгүй; зөвхөн `SUPABASE_SERVICE_ROLE_KEY`-тэй server-side API л RLS-г bypass хийнэ
- **`src/lib/orders.ts`** — `OrderTier`, `OrderStatus`, `ReportOrder`, `CreateOrderInput`, `TIER_PRICES` (49,900 / 99,000 / 299,000 ₮), `TIER_LABELS`, `generateOrderCode()` (формат: `BA-YYYYMM-XXXX`, 32^4 ≈ 1M unique/сар, I/O/0/1 хасагдсан alphabet, `node:crypto.randomInt`-р санамсаргүй сонгоно)
- **`src/app/api/orders/create/route.ts`** — `POST` endpoint:
  - Input: `tier`, `customer_name?`, `customer_phone?`, `customer_email?`, `project_snapshot`
  - Validate: `tier` нь 3 утгын аль нэг; `project_snapshot` нь object (массив биш); бусад талбар trim+200 char хязгаартай, заавал биш
  - Service-role Supabase client (`SUPABASE_SERVICE_ROLE_KEY` дутвал 503 `config_missing`)
  - `price_mnt` нь tier-аас автоматаар сонгогдоно (client-аас үнэ илгээх боломжгүй — security)
  - `order_code` collision (Postgres SQLSTATE `23505`)-д 5 удаа дахин үүсгэн оролдоно
  - Response: `{ order_code, status, price_mnt }`

### Тэмдэглэл
- `report_orders` migration-ыг Supabase SQL Editor-т нэмж ажиллуулах хэрэгтэй (бусад migration-уудтай ижил гарын аргаар).
- Зөвхөн server API order үүсгэх боломжтой — RLS policy ороогүй нь зөвхөн service-role-руу хандалт нээх стандарт Supabase pattern (estimate_logs, өөр table-уудтай адил).
- Admin unlock policy + UI ирэх sprint-д нэмэгдэнэ. Server route нь яг адил service-role client-р RLS-г bypass хийнэ.

---

## 🆕 2026-05-16 — MVP foundation fixes

Энэ сэшний өөрчлөлтүүд (payment/PDF-руу шилжихээс өмнө хийгдсэн засварууд):

### Disclaimer текст (хэрэглэгчийн шаардсан стандартыг 4 газарт ил)
- `src/lib/constants.ts` — `DISCLAIMER_TEXT` шинэ стандарт текстээр солигдсон:
  > Энэхүү тайлан нь инженерийн зураг төсөл, мэргэжлийн төсөвчин, архитектор, барилгын инженерийн дүгнэлтийг орлохгүй. Зөвхөн эхний шатны төлөвлөлт, төсвийн баримжаа, эрсдэл ойлгох, ажлын дараалал гаргах зориулалттай.
- **Landing footer** (`Footer.tsx`) — old hard-coded текст устгаж `DISCLAIMER_TEXT` import-лосон
- **Questionnaire submit** (`questionnaire/page.tsx`) — final step-ийн amber banner-ыг `DISCLAIMER_TEXT`-ээр сольсон
- **Results page** (`results/page.tsx`) — assessment-аас уншдаг (`assessment.disclaimer`), engine `runAssessment` нь `constants.DISCLAIMER_TEXT`-ыг тарьдаг → автоматаар шинэчлэгдсэн
- **Pricing хуудас** (`pricing/page.tsx`) — pricing cards дор шинэ amber banner нэмсэн

### /results hydration race fix
- `src/hooks/useProject.ts` — Zustand persist-д `hasHydrated` flag + `onRehydrateStorage` callback нэмсэн
- `src/app/results/page.tsx`:
  - `useEffect(router.push)` auto-redirect устгасан → hydration race арилсан
  - `!hasHydrated` бол loading spinner
  - `!assessment` бол ил тод CTA: "Тооцооны мэдээлэл олдсонгүй" + `/questionnaire` товч
  - Refresh-д blank/crash болохгүй болсон

### Questionnaire submit UX
- `canProceed()`-ыг submit-ийн өмнө хатуу шалгана; алдвал visible error
- `submitError` state нэмж, амбер banner-ийн доор улаан banner-аар харуулна
- `runAssessment` throw-г silent catch биш — `console.error` + visible error message
- Persist нь Zustand persist-ээр аль хэдийн хийгддэг (асуумжийн утга localStorage-д шууд бичигддэг)

### Lint warning fix
- `src/app/checklist/page.tsx` — `checklistItems`-ыг `useMemo([assessment])`-р боож `react-hooks/exhaustive-deps` сэрэмжлүүлгийг арилгасан

### Build / Lint result (засварын дараа)
```
> next lint
✔ No ESLint warnings or errors

> next build
✓ Compiled successfully
✓ Generating static pages (23/23)
```

### Тэмдэглэл
- **/roadmap болон /checklist хуудсууд мөн хуучин `useEffect → router.push` загвартай хэвээр.** Тэдэнд ч hydration race байж болзошхүй ч энэ сэшнд /results л зас гэсэн scope тул хөндөөгүй. Хэрэв шаардлагатай бол `hasHydrated` guard-ыг тэдэнд ч хэрэглэх ажил 5 минут.
- Auth/payment/PDF — өөрчлөөгүй; ирэх sprint-ийн scope.



---

## 1. Технологийн стек

| Давхрага | Технологи | Хувилбар |
|---|---|---|
| Framework | Next.js (App Router) | 14.2 |
| Runtime | React | 18.3 |
| Language | TypeScript | 5.4 |
| State | Zustand (persist) | 4.5 |
| Styling | Tailwind CSS | 3.4 |
| DB ORM | Prisma | (генерациас орхих) |
| Auth/DB | Supabase (SSR) | 0.3 / 2.103 |
| AI SDKs | Anthropic + Google Gemini + Groq | олон provider, fallback router |
| Payments | Stripe (subscription mode) | 22 |
| Rate limit | Upstash Ratelimit + Redis | 2 |
| Icons | lucide-react | 0.378 |

`tsc --noEmit` цэвэр. `next lint` 1 warning (зөвхөн `checklist/page.tsx` exhaustive-deps). `next build` амжилттай — 23 route prerender.

---

## 2. Орчны хувьсагч (.env.example)

Шаардлагатай (хоосон гэж тавьсан):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER` (`gemini`/`groq`/`anthropic`) + `AI_FALLBACK_PROVIDERS`
- `GOOGLE_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY` (ядаж нэг)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limit)
- `INTERNAL_API_SECRET` (internal estimator route хамгаалалт)

Шаардлагатай боловч `.env.example`-д **байхгүй** (production-д төлбөр идэвхжихэд хэрэгтэй):
- `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `APP_URL`
- `ADMIN_EMAIL` (admin recalibrate route эзэмшигчийн имэйл)
- `DATABASE_URL` (Prisma)

---

## 3. Routes-ийн зураглал

### Page routes (Next.js App Router)
| Route | Файл | Төрөл | Тайлбар |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Static | Landing (Hero + Problems + Features + HowItWorks + Benefits + FAQ + CTA) |
| `/questionnaire` | `src/app/questionnaire/page.tsx` | Static | 4 шаттай асуумж + InfoCard эксперт мэдээлэл |
| `/results` | `src/app/results/page.tsx` | Static | Үнэгүй preview — оноо, 3 эрсдэл, 3 алхам, эхний 2 шат + locked overlay |
| `/roadmap` | `src/app/roadmap/page.tsx` | Static | 9 шаттай (динамик) бүрэн roadmap, timeline UI |
| `/checklist` | `src/app/checklist/page.tsx` | Static | Прогресс bar бүхий task list |
| `/chat` | `src/app/chat/page.tsx` | Static | AI чат + Gemini/Groq/Anthropic fallback |
| `/pricing` | `src/app/pricing/page.tsx` | Static | Free vs Pro ($9.99/сар) — Stripe checkout |
| `/account` | `src/app/account/page.tsx` | Dynamic | Хэрэглэгчийн профайл, plan, usage (auth шаардана) |
| `/login` | `src/app/login/page.tsx` | Static | OTP-р нэвтрэх (одоо required бус) |
| `/knowledge` | `src/app/knowledge/page.tsx` | Dynamic | Контент сан (магадгүй static-аар Supabase-аас уншдаг) |
| `/experts` | `src/app/experts/page.tsx` | Static | Мэргэжилтнүүдийн каталог — `Coming soon` товчтой |
| `/auth/callback`, `/auth/sign-out` | — | Dynamic | Supabase auth handlers |

### API routes
| Endpoint | Метод | Зориулалт |
|---|---|---|
| `/api/assess` | POST | Questionnaire → AssessmentResult (`runAssessment`) |
| `/api/roadmap` | POST | Roadmap + checklist generation |
| `/api/chat` | POST | AI чат, rate-limit, multi-provider fallback |
| `/api/internal/estimate` | POST | Detail-тэй pricing/material estimator. `x-internal-secret` header шаардлагатай |
| `/api/admin/recalibrate` | POST | Estimator price update, `ADMIN_EMAIL`-р хязгаарлагдсан |
| `/api/stripe/create-checkout-session` | POST | Guest mode Stripe Checkout (auth-гүй) |
| `/api/stripe/webhook` | POST | Subscription state sync to Supabase `users` table |
| `/api/health/supabase` | GET | Health probe |

### Components
- `src/components/layout/Header.tsx`, `Footer.tsx`
- `src/components/landing/*` — Hero, Problems, Features, HowItWorks, Benefits, FAQ, CTA
- `src/components/questionnaire/InfoCard.tsx` — info-first UX-н дэлгэрэнгүй карт
- `src/components/EstimatorForm.tsx`, `ResultCard.tsx`, `StripeButton.tsx`

### Engine ба data layers
- `src/lib/engine/{readiness,risks,recommendations,roadmap,index}.ts` — assessment generator
- `src/lib/estimator/{data,index,recalibrate,types}.ts` — материал/үнийн тооцоо (frame/block/concrete × low/med/high)
- `src/lib/ai/{providers,tools,system-prompt,reply}.ts` — multi-provider AI router
- `src/lib/{supabase,supabase-server}.ts`, `rate-limit.ts`, `constants.ts`, `types.ts`

### Prisma (тодорхойлогдсон, push хийгдсэн эсэх шалгаагүй)
Models: `Profile`, `Project`, `ReadinessAssessment`, `RoadmapStep`, `ChecklistItem`, `ChatMessage`, `ContentArticle`, `ExpertCategory`, `Referral`. Enums: `PlanType{FREE,PAID,PREMIUM}`, `ProjectStatus`, `StepStatus`, `MessageRole`.

---

## 4. Feature presence vs MVP target

| MVP element | Байгаа эсэх | Жич |
|---|---|---|
| Landing | ✅ бүрэн | Hero+Problems+Features+HowItWorks+Benefits+FAQ+CTA, монгол хэлээр |
| Questionnaire | ✅ бүрэн | 4 алхам, InfoCard, Zustand persist |
| Result preview (үнэгүй) | ⚠️ хэсэгчилсэн | Оноо, 3 эрсдэл, 3 алхам байгаа. Гэхдээ **бюджэтийн range, төслийн төрөл (project type) илрэн харагдахгүй**. Доорх `/pricing`-руу заасан CTA нь ₮29,900 хэлж байна (MVP-н үнэтэй таарахгүй) |
| AI чат | ✅ бүрэн | Gemini/Groq/Anthropic, rate-limit |
| Estimator | ✅ дотоод API | UI-аас `/api/internal/estimate`-руу холбогдох client wrapper байхгүй; зөвхөн `EstimatorForm.tsx` component байгаа боловч ямар route-д mount хийгдээгүй |
| Pricing хуудас | ⚠️ Stripe subscription | Одоо $9.99/сар (sub model). **MVP нь нэг удаагийн ₮49,900 / ₮99,000 / ₮199-299k байх ёстой** |
| PDF тайлан экспорт | ❌ байхгүй | Зөвхөн "татаж авах" дүрс байна, бодит generator байхгүй |
| Гар аргаар төлбөр (manual) | ❌ байхгүй | Stripe-р л явдаг. Монголд QPay/банкны шилжүүлэг бэлэн биш |
| Admin unlock dashboard | ❌ байхгүй | Stripe webhook нь зөвхөн subscription горимтой. Manual unlock UI бүтэхгүй |
| Admin route | ⚠️ хэсэгчилсэн | `/api/admin/recalibrate` — estimator price update only. **Захиалга харах/нээх UI байхгүй** |
| Supabase | ✅ wired | `users` table-руу webhook бичдэг; нөгөө талаар Prisma schema-тэй давхардсан байж болзошгүй |
| AI provider | ✅ multi-provider | Үнэгүй tier-аас эхэлдэг |
| Disclaimer (заавал) | ⚠️ хагас | `DISCLAIMER_TEXT` бий, гэхдээ **хэрэглэгчээс шаардсан текст** ("инженерийн зураг төсөл, мэргэжлийн төсөвчин..." гэх) одоогийн `constants.ts`-д байхгүй — солих хэрэгтэй |

---

## 5. MVP-д дутагдаж буй гол функционалууд

### 5a. Payment & unlock — бүхэлдээ дахин угсрах хэрэгтэй
- Stripe sub mode → нэг удаагийн төлбөрийн model (one-time или Mongolian QPay/банк шилжүүлэг)
- "Manual payment" — захиалга үүсгээд админ бүртгэж нээдэг flow байхгүй
- Захиалгын төлвийг хадгалах `orders` буюу `report_unlocks` table одоо байхгүй
- Хэрэглэгчийн email ↔ assessment-ийг холбоход анонимоор боломжгүй (Zustand persist зөвхөн localStorage)

### 5b. PDF generation — бүтэн дутуу
- `@react-pdf/renderer`, `puppeteer`, эсвэл `pdf-lib` шиг lib суусан биш
- Tайлангийн HTML template байхгүй
- 9-шатны roadmap, 30-50 checklist item, эрсдэл, эксперт зөвлөмжийг PDF-руу гаргах layout байхгүй

### 5c. Admin unlock UI
- `/admin` route байхгүй
- Захиалга харах list, "unlock" товчлуур, email илгээх workflow байхгүй

### 5d. Бодит disclaimer
- Хэрэглэгчийн шаардсан стандарт текст `constants.ts`-д орох ёстой
- Дор хаяж: landing, questionnaire submit, result preview, PDF гарчиг — 4 газарт ил харагдах ёстой

### 5e. Result preview-н бүтэц
- "Project type" (frame/block/concrete) илрүүлсэн талбар алга
- "Budget range" дэлгэрүүлсэн ₮... – ₮... харагдах ёстой (одоо зөвхөн оноо болон 2 phase preview)

### 5f. Pro questions (paid-only AI)
- "Pro-only" асуултын хязгаар paid track-д орохгүй; chat нь бүгдэд нь нээлттэй

### 5g. Database persistence
- Assessment одоогоор зөвхөн Zustand localStorage-д. Хэрэглэгч browser-ээ цэвэрлэвэл алдагдана.
- Manual payment flow нь сервер дээр assessment-ыг хадгалах ёстой (одоо боломжгүй).

---

## 6. Build / Lint үр дүн

```
> next lint
./src/app/checklist/page.tsx
22:9  Warning: react-hooks/exhaustive-deps
```
1 warning, error байхгүй.

```
> next build
✓ Compiled successfully
✓ Generating static pages (23/23)
```
Bundle хэмжээ хэвийн (хамгийн их `/login` 61.9 kB, дунджаар ~2-3 kB).

`tsc --noEmit` ажиллаа, output байхгүй (цэвэр).

---

## 7. Ажиллах кодын чухал тэмдэглэл

- **Questionnaire submit silent catch:** `src/app/questionnaire/page.tsx:394-396` дотор `runAssessment` throw хийвэл `catch {}` шууд залгидаг — хэрэглэгч юу ч харахгүй (Issue 3-ын нэг шалтгаан).
- **Results hydration race:** `src/app/results/page.tsx:132-134` Zustand persist rehydrate хийхээс өмнө `router.push("/questionnaire")` асаж магадгүй (Issue 3-ын нөгөө шалтгаан).
- **Auth one-flow drop хийгдсэн (2026-05-16):** `middleware.ts` устгасан; Stripe checkout guest горимд; `/pricing` Free button `/questionnaire`-руу. `/login`, `/auth/*`, `/account` файлууд хэвэндээ боловч user-facing flow-д заавал биш.
- **Disclaimer текст шинэчлэх ёстой:** хэрэглэгчийн шаардсан "Энэхүү тайлан нь инженерийн зураг төсөл, мэргэжлийн төсөвчин..." стандарт текстээр сольж, `DISCLAIMER_TEXT` болгож тогтооно.
- **Prisma vs Supabase раздвоение:** Prisma schema-д `Profile`, `Project` table-ууд тодорхойлогдсон. Stripe webhook нь `users` гэдэг **өөр** table-руу бичиж байна. Тогтсон data model шийдвэр гарах ёстой (бүрэн Supabase, бүрэн Prisma, эсвэл аль аль нь).

---

## 8. Дараагийн алхам

Дэлгэрэнгүйг [`BAISHIN_30_DAY_PAID_MVP_PLAN.md`](./BAISHIN_30_DAY_PAID_MVP_PLAN.md) дотор.
