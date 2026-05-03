-- ============================================================
-- Bayshin A-Z Estimator SaaS — version 1 seed data.
-- Mongolia 2026 market ranges. Idempotent (on conflict do nothing).
-- Run AFTER 04-create-saas-tables.sql.
-- ============================================================

-- price_table (₮/m²)
insert into public.price_table (version, house_type, quality, base_min, base_max) values
  (1, 'frame',    'low',    1020000, 1380000),
  (1, 'frame',    'medium', 1360000, 1840000),
  (1, 'frame',    'high',   1870000, 2530000),
  (1, 'block',    'low',    1275000, 1725000),
  (1, 'block',    'medium', 1700000, 2300000),
  (1, 'block',    'high',   2380000, 3220000),
  (1, 'concrete', 'low',    1530000, 2070000),
  (1, 'concrete', 'medium', 2040000, 2760000),
  (1, 'concrete', 'high',   2975000, 4025000)
on conflict (version, house_type, quality) do nothing;

-- multipliers
insert into public.multipliers (version, kind, key, value) values
  -- floor
  (1, 'floor',    '1', 1.00),
  (1, 'floor',    '2', 1.05),
  (1, 'floor',    '3', 1.12),
  -- location
  (1, 'location', 'city',  1.00),
  (1, 'location', 'rural', 0.90),
  -- range (±%)
  (1, 'range',    'pct',   0.15),
  -- margins
  (1, 'margin',   'profit_pct',      0.15),
  (1, 'margin',   'contingency_pct', 0.10),
  (1, 'margin',   'vat_pct',         0.10),
  -- season multipliers (only non-1.0 values)
  (1, 'season',   'frame_winter',    1.05),
  (1, 'season',   'block_winter',    1.10),
  (1, 'season',   'concrete_autumn', 1.05),
  (1, 'season',   'concrete_winter', 1.20)
on conflict (version, kind, key) do nothing;

-- material_table — share of total cost per house type
insert into public.material_table (version, house_type, rank, name, share) values
  (1, 'frame',    1, 'Мод / SIP панель', 0.30),
  (1, 'frame',    2, 'Дулаалга',         0.18),
  (1, 'frame',    3, 'Суурийн бетон',    0.15),
  (1, 'frame',    4, 'Дээвэр',           0.12),
  (1, 'frame',    5, 'OSB / гадна',      0.10),

  (1, 'block',    1, 'Блок',    0.32),
  (1, 'block',    2, 'Цемент',  0.18),
  (1, 'block',    3, 'Арматур', 0.12),
  (1, 'block',    4, 'Элс',     0.10),
  (1, 'block',    5, 'Дээвэр',  0.10),

  (1, 'concrete', 1, 'Бетон',    0.35),
  (1, 'concrete', 2, 'Арматур',  0.20),
  (1, 'concrete', 3, 'Дулаалга', 0.12),
  (1, 'concrete', 4, 'Хашмал',   0.10),
  (1, 'concrete', 5, 'Дээвэр',   0.08)
on conflict (version, house_type, rank) do nothing;

-- duration_table (months)
insert into public.duration_table
  (version, house_type, base_min_months, base_max_months, per_extra_floor_min, per_extra_floor_max) values
  (1, 'frame',    4,  7, 1, 2),
  (1, 'block',    5,  9, 1, 2),
  (1, 'concrete', 7, 12, 2, 3)
on conflict (version, house_type) do nothing;
