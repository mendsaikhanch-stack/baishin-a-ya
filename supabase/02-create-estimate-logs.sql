-- ============================================================
-- БОСГО — estimate_logs table
-- Зориулалт: /api/internal/estimate-р дамжсан бүх дуудлагыг
-- internal-use logging, recalibration, debugging-д хадгалах.
-- Idempotent — олон удаа ажиллуулсан ч аюулгүй.
-- ============================================================

create table if not exists public.estimate_logs (
  id           uuid        primary key default gen_random_uuid(),
  session_id   text,
  source       text        not null default 'api', -- 'api' | 'chat_tool' | 'admin'
  input        jsonb       not null,
  output       jsonb       not null,
  latency_ms   integer,
  client_ip    text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_estimate_logs_created_at
  on public.estimate_logs (created_at desc);

create index if not exists idx_estimate_logs_session
  on public.estimate_logs (session_id);

create index if not exists idx_estimate_logs_source
  on public.estimate_logs (source);

-- RLS: бүх хэрэглэгчид хаалттай. Зөвхөн service-role түлхүүртэй
-- backend (next.js API route) л унших/бичих эрхтэй.
alter table public.estimate_logs enable row level security;

-- (Зориуд policy үүсгэхгүй: service-role нь RLS-ийг bypass хийдэг.)

-- Auto-update updated_at trigger хэрэггүй (зөвхөн insert хийнэ).

-- ============================================================
-- (Сонголттой) estimator_inputs_summary view —
-- Сүүлийн 30 өдрийн дуудлагын ангиллыг хурдан харах:
-- ============================================================
create or replace view public.estimate_logs_recent as
select
  date_trunc('day', created_at)            as day,
  input->>'type'                            as house_type,
  input->>'quality'                         as quality,
  input->>'location'                        as location,
  count(*)                                  as calls,
  avg((output->'price_total'->>'min')::numeric) as avg_min_price,
  avg((output->'price_total'->>'max')::numeric) as avg_max_price,
  avg(latency_ms)                           as avg_latency_ms
from public.estimate_logs
where created_at >= now() - interval '30 days'
group by 1, 2, 3, 4
order by day desc, calls desc;
