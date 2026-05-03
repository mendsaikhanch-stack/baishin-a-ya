-- ============================================================
-- Bayshin A-Z Estimator SaaS — full reference + user tables.
-- Idempotent.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- users — extends auth.users with plan + usage counters
-- ────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                       uuid        primary key references auth.users(id) on delete cascade,
  email                    text        not null,
  plan                     text        not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id       text,
  stripe_subscription_id   text,
  current_period_end       timestamptz,
  daily_estimates          integer     not null default 0,
  daily_reset_at           date        not null default current_date,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index if not exists idx_users_stripe_customer
  on public.users (stripe_customer_id) where stripe_customer_id is not null;

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- price_table — versioned base ₮/m²
-- ────────────────────────────────────────────────────────────
create table if not exists public.price_table (
  id           uuid        primary key default gen_random_uuid(),
  version      integer     not null,
  house_type   text        not null check (house_type in ('frame','block','concrete')),
  quality      text        not null check (quality in ('low','medium','high')),
  base_min     numeric     not null check (base_min > 0),
  base_max     numeric     not null check (base_max > base_min),
  effective_at timestamptz not null default now(),
  retired_at   timestamptz,
  unique (version, house_type, quality)
);

create or replace view public.price_table_current as
  select house_type, quality, base_min, base_max, version
  from public.price_table where retired_at is null;

-- ────────────────────────────────────────────────────────────
-- multipliers — floor / location / range / margin / season
-- ────────────────────────────────────────────────────────────
create table if not exists public.multipliers (
  id           uuid        primary key default gen_random_uuid(),
  version      integer     not null,
  kind         text        not null check (kind in ('floor','location','range','margin','season')),
  key          text        not null,
  value        numeric     not null,
  effective_at timestamptz not null default now(),
  retired_at   timestamptz,
  unique (version, kind, key)
);

-- ────────────────────────────────────────────────────────────
-- material_table — share % per house type
-- ────────────────────────────────────────────────────────────
create table if not exists public.material_table (
  id           uuid        primary key default gen_random_uuid(),
  version      integer     not null,
  house_type   text        not null check (house_type in ('frame','block','concrete')),
  rank         integer     not null check (rank between 1 and 5),
  name         text        not null,
  share        numeric     not null check (share > 0 and share < 1),
  effective_at timestamptz not null default now(),
  retired_at   timestamptz,
  unique (version, house_type, rank)
);

-- ────────────────────────────────────────────────────────────
-- duration_table — base months and per-extra-floor adders
-- ────────────────────────────────────────────────────────────
create table if not exists public.duration_table (
  id                    uuid        primary key default gen_random_uuid(),
  version               integer     not null,
  house_type            text        not null check (house_type in ('frame','block','concrete')),
  base_min_months       integer     not null,
  base_max_months       integer     not null,
  per_extra_floor_min   integer     not null,
  per_extra_floor_max   integer     not null,
  effective_at          timestamptz not null default now(),
  retired_at            timestamptz,
  unique (version, house_type)
);

-- ────────────────────────────────────────────────────────────
-- recalibration_log — admin price/multiplier change audit
-- ────────────────────────────────────────────────────────────
create table if not exists public.recalibration_log (
  id           uuid        primary key default gen_random_uuid(),
  table_name   text        not null check (table_name in ('price_table','multipliers','material_table','duration_table')),
  from_version integer     not null,
  to_version   integer     not null,
  diff         jsonb       not null,
  reason       text,
  changed_by   text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_recalibration_log_created
  on public.recalibration_log (created_at desc);

-- ────────────────────────────────────────────────────────────
-- Daily quota helper (called from /api/estimate)
-- ────────────────────────────────────────────────────────────
create or replace function public.increment_daily_estimates(p_user_id uuid)
returns void as $$
begin
  update public.users
  set daily_estimates = case
        when daily_reset_at < current_date then 1
        else daily_estimates + 1
      end,
      daily_reset_at = current_date,
      updated_at = now()
  where id = p_user_id;
end $$ language plpgsql security definer;

-- ────────────────────────────────────────────────────────────
-- RLS — service-role only by default
-- ────────────────────────────────────────────────────────────
alter table public.users              enable row level security;
alter table public.price_table        enable row level security;
alter table public.multipliers        enable row level security;
alter table public.material_table     enable row level security;
alter table public.duration_table     enable row level security;
alter table public.recalibration_log  enable row level security;

-- users: read/update own profile only
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth.uid() = id);

-- price_table_current view: allow public read (no raw min/max breakdown? returns same data)
-- If you want it stricter, drop this grant and route via API.
grant select on public.price_table_current to anon, authenticated;
