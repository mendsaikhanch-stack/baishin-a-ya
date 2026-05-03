# Резюме — Дараа үргэлжлүүлэхэд хаанаас эхлэх вэ

> Сүүлд зогссон цэг: **Anthropic credit дуусаж AI хариулж чадахгүй болсон.**
> Бусад бүх зүйл бэлэн.

---

## Одоогийн төлөв

| Хэсэг | Төлөв |
|---|---|
| Supabase project | ✅ Үүссэн, холбогдсон |
| `content_articles` table | ✅ Үүссэн |
| RLS policy (`Public can read published...`) | ✅ Идэвхтэй |
| Sample seed rows | ✅ 7 row (1 тест + 6 жишээ) |
| `.env.local` (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/ANTHROPIC_API_KEY) | ✅ Бөглөгдсөн |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `/api/health/supabase` | ✅ `{ok: true}` |
| `/api/chat` | ⚠️ Anthropic credit дутуу |

---

## Эргэж ирээд хийх 3 алхам

### 1. Anthropic credit нэмэх
- https://console.anthropic.com/settings/plans
- "Add credits" эсвэл "Upgrade plan"
- $5–10 кредит (pay-as-you-go) — энэ нь хангалттай эхлэлт

### 2. Dev server-ыг асаах
```sh
cd C:/Users/MNG/baishin-a-ya
npm run dev
```

### 3. Тест хийх
Шинэ терминал нээгээд:
```sh
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"8х10 тоосгон байшинд хэдэн тонн цемент орох вэ?"}'
```

Эсвэл http://localhost:3000/chat хуудсыг нээж асуултаа бичээрэй.

Амжилттай хариу ирвэл — **бүгд дууссан**. AI агент, tool calling, Supabase холболт бүгд ажиллаж байна.

---

## Хямд эхлэх (нэмэлт)

`.env.local`-д Sonnet-ийн оронд Haiku-г default болгож тестлэвэл ~5 дахин хямд (Haiku 4.5 нь $1/1M input, $5/1M output):

```
ANTHROPIC_MODEL_DEFAULT=claude-haiku-4-5
ANTHROPIC_MODEL_STRONG=claude-sonnet-4-6
```

⚠️ **Анхаар:** Haiku 4.5 нь `output_config.effort` параметрийг дэмжихгүй (Sonnet 4.6, Opus 4.5+ л дэмждэг). Haiku-г default болгох бол `src/lib/ai/reply.ts`-ийн `output_config: { effort: 'medium' }` мөрийг **Haiku ашиглагдах үед буулгах** хэрэгтэй. Энэ задлал хэрэгтэй болбол хэлэх — тусална.

Production / бодит чанарт буцахдаа:
```
ANTHROPIC_MODEL_DEFAULT=claude-sonnet-4-9-6
ANTHROPIC_MODEL_STRONG=claude-opus-4-7
```

---

## Git төлөв (uncommitted)

`git status`:
- Засагдсан файлууд (8): `.env.example`, `package.json`, `src/app/api/chat/route.ts`, `src/app/chat/page.tsx`, `src/app/checklist/page.tsx`, `src/app/questionnaire/page.tsx`, `src/lib/ai/reply.ts`, `src/lib/supabase-server.ts`
- Шинэ файлууд: `.eslintrc.json`, `docs/`, `src/lib/ai/tools/`, `supabase/`

Эдгээр өөрчлөлт **алдагдаагүй** — таны диск дээр аюулгүй байна. Эргэж ирээд commit хийх эсвэл цаашаа ажиллаж болно.

Хэрвээ commit хиймээр байгаа бол:
```sh
git add .
git commit -m "Add agentic AI tool-use loop, Supabase RLS, validation, tests"
```

---

## Setup гарын авлага (нэмэлт)

Хэрэв алхамыг бүхэлд нь дахин үзэх хэрэгтэй болбол:
- `docs/supabase-setup.md` — Supabase setup алхмууд
- `docs/test-prompts.md` — AI тест prompt-ууд
- `supabase/01-create-content-articles.sql` — table creation
- `supabase/seed-content-articles.sql` — RLS + seed
