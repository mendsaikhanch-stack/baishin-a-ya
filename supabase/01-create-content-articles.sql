-- ============================================================
-- Байшин А-Я — content_articles table creation
-- Supabase SQL Editor дээр эхэнд ажиллуулна.
-- Idempotent — олон удаа ажиллуулсан ч аюулгүй.
-- ============================================================

create table if not exists public.content_articles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  slug text unique not null,
  summary text,
  content text not null,
  language text not null default 'mn',
  published boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_category
  on public.content_articles(category);

create index if not exists idx_articles_slug
  on public.content_articles(slug);

-- Auto-update updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'articles_updated_at'
      and tgrelid = 'public.content_articles'::regclass
  ) then
    create trigger articles_updated_at
      before update on public.content_articles
      for each row execute function public.update_updated_at();
  end if;
end $$;
