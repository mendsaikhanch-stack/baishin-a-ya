-- ============================================================
-- БОСГО — Мэдлэгийн сан, 2-р шат (Q&A баяжих гогцоо)
-- Supabase SQL editor-т (Dashboard → SQL) бүхэлд нь хуулж ажиллуул.
-- Дахин ажиллуулахад аюулгүй (idempotent).
-- ============================================================

-- 1) Chat дахь хэрэглэгчийн асуултуудыг лог хийх хүснэгт.
--    Зорилго: давтагдах сэдэв/цоорхойг олж мэдлэгийн санг баяжуулах.
--    Зөвхөн асуултын текст хадгална — IP/нэр/имэйл хадгалахгүй.
create table if not exists public.chat_questions (
  id           uuid primary key default gen_random_uuid(),
  question     text        not null,
  char_len     int         not null default 0,
  had_context  boolean     not null default false,
  topic        text,
  processed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_chat_questions_processed
  on public.chat_questions (processed_at);
create index if not exists idx_chat_questions_created
  on public.chat_questions (created_at desc);

-- RLS: зөвхөн service-role (сервер) бичиж/уншина. Анонимд хаалттай.
alter table public.chat_questions enable row level security;
-- (Бодлого нэмэхгүй → service_role түлхүүр RLS-ийг тойрно, бусад нь хаалттай.)

-- 2) content_articles-д дэд ангилал (GuideCategory) нэмэх.
--    Утга: before_starting | land_selection | budget_planning |
--          material_selection | foundation | seasonal_timing
alter table public.content_articles
  add column if not exists subcategory text;
