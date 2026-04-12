# Байшин А-Я

Монголд хувийн байшин барихыг хүссэн хүн бүрт зориулсан ухаалаг төлөвлөлтийн туслах.

## Хурдан эхлэх

```bash
# Dependencies суулгах
npm install

# .env файл үүсгэх
cp .env.example .env.local

# Dev server эхлүүлэх
npm run dev
```

http://localhost:3000 дээр нээнэ.

## Технологи

- **Next.js 14** — App Router
- **TypeScript**
- **Tailwind CSS**
- **Supabase** — Database & Auth
- **Zustand** — Client state
- **Lucide React** — Icons

## Бүтэц

```
src/
├── app/           # Pages & API routes
├── components/    # Reusable UI components
├── lib/           # Core logic
│   └── engine/    # Recommendation engine
├── hooks/         # React hooks
└── i18n/          # Translations (mn, en)
```

## Чухал

⚠️ Энэ апп нь зөвхөн төлөвлөлтийн туслах бөгөөд мэргэжлийн архитектор, инженерийг орлохгүй.
