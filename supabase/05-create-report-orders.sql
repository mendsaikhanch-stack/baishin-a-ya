-- ============================================================
-- Байшин А-Я — report_orders table
-- Paid report MVP-ийн захиалгын суурь.
-- Flow: Result Preview → Create Order → Manual Payment → Admin Unlock → PDF.
-- Idempotent — олон удаа ажиллуулсан ч аюулгүй.
-- ============================================================

create table if not exists public.report_orders (
  id                uuid        primary key default gen_random_uuid(),
  order_code        text        not null unique,
  tier              text        not null
                    check (tier in ('full_pdf','premium','consultation')),
  price_mnt         integer     not null check (price_mnt > 0),
  status            text        not null default 'pending_payment'
                    check (status in ('pending_payment','paid','unlocked','cancelled')),
  customer_name     text,
  customer_phone    text,
  customer_email    text,
  project_snapshot  jsonb       not null,
  payment_note      text,
  admin_note        text,
  unlocked_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_report_orders_status
  on public.report_orders (status);
create index if not exists idx_report_orders_created
  on public.report_orders (created_at desc);
create index if not exists idx_report_orders_email
  on public.report_orders (customer_email)
  where customer_email is not null;

-- ────────────────────────────────────────────────────────────
-- updated_at auto-touch trigger
-- ────────────────────────────────────────────────────────────
create or replace function public.set_report_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists trg_report_orders_updated_at on public.report_orders;
create trigger trg_report_orders_updated_at
  before update on public.report_orders
  for each row execute function public.set_report_orders_updated_at();

-- ────────────────────────────────────────────────────────────
-- RLS — closed by default (service-role only)
-- ────────────────────────────────────────────────────────────
-- Зориуд policy үүсгэхгүй:
--   * anon / authenticated роль уншиж/бичиж чадахгүй
--   * Зөвхөн SUPABASE_SERVICE_ROLE_KEY-тэй server-side API
--     (api/orders/create, ирэх admin routes) RLS-г bypass хийж ажиллана
--   * Admin update policy ирэх sprint-д захиалгын админ UI-н өмнө нэмэгдэнэ
alter table public.report_orders enable row level security;
