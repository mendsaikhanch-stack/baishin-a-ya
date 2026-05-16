import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ORDER_CODE_RE } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "report-pdfs";
const SIGNED_URL_TTL_SEC = 3600; // 1 цаг

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials missing");
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
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
    .select("status, pdf_path")
    .eq("order_code", code)
    .maybeSingle();

  if (fetchErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders/[code]/download] fetch error:", fetchErr);
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
      { error: "Order is not unlocked yet.", code: "not_unlocked" },
      { status: 403 },
    );
  }
  if (!order.pdf_path) {
    return NextResponse.json(
      { error: "PDF is not generated yet.", code: "not_ready" },
      { status: 404 },
    );
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(order.pdf_path, SIGNED_URL_TTL_SEC);
  if (signErr || !signed?.signedUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[orders/[code]/download] sign error:",
        signErr,
      );
    }
    return NextResponse.json(
      { error: "Failed to create download link.", code: "storage_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: signed.signedUrl,
    expires_in: SIGNED_URL_TTL_SEC,
  });
}
