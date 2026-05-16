import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ORDER_CODE_RE,
  STATUS_TRANSITIONS,
  VALID_STATUSES,
  type OrderStatus,
  type OrderTier,
} from "@/lib/orders";
import {
  generateAndStoreReportPDF,
  type PdfOrderInput,
} from "@/lib/report-pdf-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// unlock + inline PDF generation хүртэл хүлээгдэх боломжтой.
export const maxDuration = 60;

const MAX_NOTE_LEN = 1000;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials missing");
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Admin only.", code: auth.reason },
      { status: auth.status },
    );
  }

  const code = (params.code ?? "").trim().toUpperCase();
  if (!ORDER_CODE_RE.test(code)) {
    return NextResponse.json(
      { error: "Invalid order code.", code: "invalid_code" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "invalid_json" },
      { status: 400 },
    );
  }

  const r = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const newStatus = r.status;
  if (
    typeof newStatus !== "string" ||
    !(VALID_STATUSES as readonly string[]).includes(newStatus)
  ) {
    return NextResponse.json(
      {
        error: "status must be one of: pending_payment, paid, unlocked, cancelled.",
        code: "invalid_status",
        field: "status",
      },
      { status: 400 },
    );
  }

  const adminNote =
    typeof r.admin_note === "string"
      ? r.admin_note.trim().slice(0, MAX_NOTE_LEN) || null
      : null;

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Server not configured.", code: "config_missing" },
      { status: 503 },
    );
  }

  // unlocked шилжилт дээр inline PDF үүсгэх учир бүх шаардлагатай талбарыг авна.
  const { data: existing, error: fetchErr } = await supabase
    .from("report_orders")
    .select(
      "status, admin_note, tier, price_mnt, created_at, project_snapshot",
    )
    .eq("order_code", code)
    .maybeSingle();

  if (fetchErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin/orders/[code]/status] fetch error:", fetchErr);
    }
    return NextResponse.json(
      { error: "Failed to fetch order.", code: "db_error" },
      { status: 500 },
    );
  }
  if (!existing) {
    return NextResponse.json(
      { error: "Order not found.", code: "not_found" },
      { status: 404 },
    );
  }

  const currentStatus = existing.status as OrderStatus;
  const target = newStatus as OrderStatus;

  // No-op: same status. Reject so admin sees clear feedback rather than silent success.
  if (currentStatus === target) {
    return NextResponse.json(
      {
        error: `Order is already in '${target}'.`,
        code: "no_change",
        from: currentStatus,
        to: target,
      },
      { status: 409 },
    );
  }

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(target)) {
    return NextResponse.json(
      {
        error: `Cannot transition from '${currentStatus}' to '${target}'.`,
        code: "invalid_transition",
        from: currentStatus,
        to: target,
      },
      { status: 409 },
    );
  }

  const updates: Record<string, unknown> = { status: target };
  if (target === "unlocked") {
    updates.unlocked_at = new Date().toISOString();
  }
  if (adminNote) {
    const ts = new Date().toISOString();
    const prev =
      typeof existing.admin_note === "string" && existing.admin_note.trim()
        ? existing.admin_note
        : "";
    const entry = `[${ts} ${auth.email}] ${adminNote}`;
    updates.admin_note = prev ? `${prev}\n${entry}` : entry;
  }

  const { error: updateErr } = await supabase
    .from("report_orders")
    .update(updates)
    .eq("order_code", code);

  if (updateErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin/orders/[code]/status] update error:", updateErr);
    }
    return NextResponse.json(
      { error: "Failed to update order.", code: "db_error" },
      { status: 500 },
    );
  }

  // ── Inline PDF үүсгэх (зөвхөн unlocked-руу шилжих үед) ──
  // Best-effort: PDF алдаа гарвал unlock-ыг buцаахгүй — захиалга нээгдсэнээр
  // үлдэх ба admin "PDF үүсгэх" товчоор дахин үүсгэх боломжтой.
  let pdf: { generated: true; pdf_path: string; size_bytes: number }
    | { generated: false; error: string; code: string }
    | null = null;

  if (target === "unlocked") {
    const input: PdfOrderInput = {
      order_code: code,
      tier: existing.tier as OrderTier,
      price_mnt: existing.price_mnt,
      created_at: existing.created_at,
      project_snapshot: existing.project_snapshot as PdfOrderInput["project_snapshot"],
    };
    const result = await generateAndStoreReportPDF(supabase, input);
    pdf = result.ok
      ? {
          generated: true,
          pdf_path: result.pdf_path,
          size_bytes: result.size_bytes,
        }
      : { generated: false, error: result.error, code: result.code };
  }

  return NextResponse.json({
    ok: true,
    order_code: code,
    status: target,
    from: currentStatus,
    ...(pdf ? { pdf } : {}),
  });
}
