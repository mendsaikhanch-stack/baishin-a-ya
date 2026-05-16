import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { VALID_STATUSES, type OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials missing");
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Admin only.", code: auth.reason },
      { status: auth.status },
    );
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const limit = parseLimit(searchParams.get("limit"));

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Server not configured.", code: "config_missing" },
      { status: 503 },
    );
  }

  let query = supabase
    .from("report_orders")
    .select(
      "order_code, tier, price_mnt, status, customer_name, customer_phone, customer_email, payment_note, admin_note, created_at, updated_at, unlocked_at, pdf_path, pdf_generated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (
    statusParam &&
    (VALID_STATUSES as readonly string[]).includes(statusParam)
  ) {
    query = query.eq("status", statusParam as OrderStatus);
  }

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin/orders GET] db error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch orders.", code: "db_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ orders: data ?? [] });
}
