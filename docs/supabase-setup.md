# Supabase Setup — Байшин А-Я

Энэ гарын авлага нь шинэ Supabase project-ыг үүсгэж, app-тай холбох бүх алхмыг агуулсан.

---

## 1. Supabase project үүсгэх

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) руу орж нэвтэр.
2. **New project** дарж шинэ project үүсгэ:
   - **Name:** `baishin-a-ya` (эсвэл өөрийн нэр)
   - **Database Password:** найдвартай нууц үг (хадгал)
   - **Region:** хэрэглэгчдэд хамгийн ойрхон (жнь. `Northeast Asia (Tokyo)`)
   - **Pricing Plan:** Free хангалттай эхэн үед
3. Project үүсэх хүртэл 1–2 минут хүлээ.

---

## 2. API key, URL хуулах

1. Шинэ project-ийн **Settings → API** руу очно уу.
2. Дараах хоёр утгыг хуулна:
   - **Project URL** (жнь. `https://xxxxxxxx.supabase.co`)
   - **anon public** key (`eyJ...` гэж эхэлдэг JWT)

> ⚠️ `service_role` key-г хэзээ ч client тал руу гаргаж болохгүй. Энэхүү app нь зөвхөн `anon` key + RLS ашиглана.

---

## 3. `.env.local` файл

Project root дотор `.env.local` файл байх ёстой. Дараах форматаар бөглө:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# Anthropic (chat AI)
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL_DEFAULT=claude-sonnet-4-6
ANTHROPIC_MODEL_STRONG=claude-opus-4-7

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Байшин А-Я
```

> 💡 `.env.example`-аас хуулж эхлэх боломжтой:
> ```sh
> cp .env.example .env.local
> ```

---

## 4. `content_articles` table үүсгэх

1. Supabase dashboard-ийн **SQL Editor** руу очно уу.
2. **New query** дарна.
3. `supabase/01-create-content-articles.sql` файлын агуулгыг хуулж тавь.
4. **Run** товч (эсвэл `Ctrl+Enter`).

Амжилттай гарвал `content_articles` хүснэгт **Table Editor** дотор гарна.

> 💡 Үндсэн бүх table (profiles, projects, roadmap_steps г.м)-ийг үүсгэх юм бол project root дахь `supabase-schema.sql`-ыг ашиглана. `01-create-content-articles.sql` зөвхөн AI-ийн `get_building_info` tool-д шаардлагатай table-ыг үүсгэдэг.

---

## 5. RLS policy + sample seed

1. Дахиад **SQL Editor → New query**.
2. `supabase/seed-content-articles.sql` файлын агуулгыг хуулж тавь.
3. **Run** товч.

Энэ нь:
- `content_articles`-д **RLS** идэвхжүүлнэ.
- Public SELECT policy үүсгэнэ (`published = true` бичлэгийг anon/authenticated уншина).
- 6 жишээ row нэмнэ (БНбД, checklist, roadmap, project категориуд).

> Идэмхий (idempotent): олон удаа ажиллуулсан ч давхар бичлэг үүсгэхгүй (`on conflict (slug) do nothing`).

---

## 6. Холболт тест хийх

### Localhost дээр

```sh
npm install
npm run dev
```

Дараа нь хөтчөөр доорхыг нээ:

```
http://localhost:3000/api/health/supabase
```

Хэрэв холболт зөв бол `{"ok": true, ...}` хэлбэрийн JSON буцна. `error` талбартай хариулт ирвэл:
- `.env.local`-д URL/key зөв эсэхийг шалга
- Restart `npm run dev` (env өөрчилсний дараа сэргээх шаардлагатай)

### AI chat тест

Терминал дээр:

```sh
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "8х10 тоосгон байшинд хэдэн тонн цемент орох вэ?"}'
```

Хариу нь JSON `{"reply": "..."}` хэлбэртэй ирэх ёстой. Dev mode дээр консолд `[ai/reply] trace:` log гарна — `model`, `toolsExecuted`, `webSearchUsed` талбаруудыг шалгаарай.

### Roadmap/checklist тест

```sh
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Би 6х8 жижиг байшин барих гэж байна. Эхлээд ямар дарааллаар явах вэ?"}'
```

`get_building_info({type: "roadmap"})` дуудагдаж, `content_articles`-аас seed row уншигдсан байх ёстой.

---

## Troubleshooting

| Алдаа | Шалтгаан | Засвар |
|---|---|---|
| `relation "content_articles" does not exist` | Table үүсгээгүй | `01-create-content-articles.sql` ажиллуул |
| `permission denied for table content_articles` | RLS policy дутуу | `seed-content-articles.sql` ажиллуул |
| Empty array бүх асуултад | Seed row байхгүй эсвэл `published = false` | `seed-content-articles.sql` дахин ажиллуул |
| `Invalid API key` | URL/key буруу эсвэл .env.local restart хэрэгтэй | Dev сервер restart |
| `503 missing_api_key` | `ANTHROPIC_API_KEY` тохируулагдаагүй | `.env.local`-д key нэмж restart |

---

## Үүсгэсэн SQL файлуудын дараалал

```
supabase/
├── 01-create-content-articles.sql    ← Эхлээд ажиллуул (table)
└── seed-content-articles.sql         ← Дараа нь (RLS + sample data)
```
