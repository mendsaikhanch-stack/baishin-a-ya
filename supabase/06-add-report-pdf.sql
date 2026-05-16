-- ============================================================
-- Байшин А-Я — Report PDF storage + tracking
-- Idempotent — олон удаа ажиллуулсан ч аюулгүй.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. report_orders дотор PDF tracking талбарууд
-- ────────────────────────────────────────────────────────────
alter table public.report_orders
  add column if not exists pdf_path text,
  add column if not exists pdf_generated_at timestamptz;

-- ────────────────────────────────────────────────────────────
-- 2. Private Storage bucket — PDF файлуудыг хадгална
--    Bucket-ийг public=false-р үүсгэж байгаа учир signed URL-р л
--    татаж болно. Upload нь зөвхөн service-role-аар хийгдэнэ.
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('report-pdfs', 'report-pdfs', false)
on conflict (id) do nothing;

-- storage.objects дээр policy үүсгэхгүй (зориуд):
--   * anon / authenticated роль direct хандах боломжгүй
--   * Server API нь SUPABASE_SERVICE_ROLE_KEY-тэй upload хийнэ
--     (storage.objects RLS-г bypass хийнэ)
--   * Signed URL нь хугацаатай (~1 цаг), хариу болж буцаагдана
