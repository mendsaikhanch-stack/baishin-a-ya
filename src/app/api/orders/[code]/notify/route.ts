import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_CODE_RE = /^BA-\d{6}-[A-Z2-9]{4}$/;
const MAX_NOTE_LEN = 1000;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
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
  const note =
    typeof r.payment_note === "string"
      ? r.payment_note.trim().slice(0, MAX_NOTE_LEN)
      : "";
  if (!note) {
    return NextResponse.json(
      {
        error: "payment_note required.",
        code: "missing_note",
        field: "payment_note",
      },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Server not configured.", code: "config_missing" },
      { status: 503 },
    );
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("report_orders")
    .select("payment_note, status")
    .eq("order_code", code)
    .maybeSingle();

  if (fetchErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders/[code]/notify] fetch error:", fetchErr);
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

  // Зөвхөн pending_payment төлөвт байгаа захиалгад л тэмдэглэл нэмж болно
  if (existing.status !== "pending_payment") {
    return NextResponse.json(
      {
        error: "Order is no longer pending.",
        code: "not_pending",
        status: existing.status,
      },
      { status: 409 },
    );
  }

  // payment_note-г overwrite биш — append, timestamp-той
  const ts = new Date().toISOString();
  const prev =
    typeof existing.payment_note === "string" && existing.payment_note.trim()
      ? existing.payment_note
      : "";
  const combined = prev ? `${prev}\n[${ts}] ${note}` : `[${ts}] ${note}`;

  const { error: updateErr } = await supabase
    .from("report_orders")
    .update({ payment_note: combined })
    .eq("order_code", code);

  if (updateErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders/[code]/notify] update error:", updateErr);
    }
    return NextResponse.json(
      { error: "Failed to save note.", code: "db_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, status: "pending_payment" });
}
