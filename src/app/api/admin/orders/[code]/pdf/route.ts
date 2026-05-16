import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { ORDER_CODE_RE, type OrderTier } from "@/lib/orders";
import {
  generateAndStoreReportPDF,
  type PdfOrderInput,
} from "@/lib/report-pdf-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials missing");
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

export async function POST(
  _req: Request,
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

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Server not configured.", code: "config_missing" },
      { status: 503 },
    );
  }

  const { data: order, error: fetchErr } = await supabase
    .from("report_orders")
    .select(
      "order_code, tier, price_mnt, status, created_at, project_snapshot",
    )
    .eq("order_code", code)
    .maybeSingle();

  if (fetchErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin/pdf] fetch error:", fetchErr);
    }
    return NextResponse.json(
      { error: "Failed to fetch order.", code: "db_error" },
      { status: 500 },
    );
  }
  if (!order) {
    return NextResponse.json(
      { error: "Order not found.", code: "not_found" },
      { status: 404 },
    );
  }
  if (order.status !== "unlocked") {
    return NextResponse.json(
      {
        error: "PDF can only be generated for unlocked orders.",
        code: "not_unlocked",
        status: order.status,
      },
      { status: 409 },
    );
  }

  const input: PdfOrderInput = {
    order_code: order.order_code,
    tier: order.tier as OrderTier,
    price_mnt: order.price_mnt,
    created_at: order.created_at,
    project_snapshot: order.project_snapshot as PdfOrderInput["project_snapshot"],
  };
  const result = await generateAndStoreReportPDF(supabase, input);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    pdf_path: result.pdf_path,
    pdf_generated_at: result.pdf_generated_at,
    size_bytes: result.size_bytes,
  });
}
