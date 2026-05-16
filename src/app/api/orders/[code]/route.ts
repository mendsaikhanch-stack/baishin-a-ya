import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Зөвхөн generateOrderCode-аас үүсэх форматыг зөвшөөрнө: BA-YYYYMM-XXXX
const ORDER_CODE_RE = /^BA-\d{6}-[A-Z2-9]{4}$/;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials missing");
  return createClient(url, key, { auth: { persistSession: false } });
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

  // Зөвхөн public-аар харагдах талбарууд (project_snapshot, payment/admin notes хэзээ ч буцаахгүй)
  const { data, error } = await supabase
    .from("report_orders")
    .select("order_code, tier, price_mnt, status, created_at")
    .eq("order_code", code)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders/[code] GET] db error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch order.", code: "db_error" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Order not found.", code: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
