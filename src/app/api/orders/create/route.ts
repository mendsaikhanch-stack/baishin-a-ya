import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  TIER_PRICES,
  VALID_TIERS,
  type CreateOrderInput,
  type OrderTier,
} from "@/lib/orders";
import { generateOrderCode } from "@/lib/orders.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CODE_RETRIES = 5;
const MAX_STR_LEN = 200;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server credentials missing");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type ValidationResult =
  | { ok: true; value: CreateOrderInput }
  | { ok: false; error: string; field?: string };

function readStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_STR_LEN);
}

function validateInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const r = raw as Record<string, unknown>;

  if (!VALID_TIERS.includes(r.tier as OrderTier)) {
    return {
      ok: false,
      error: "tier must be one of: full_pdf, premium, consultation.",
      field: "tier",
    };
  }

  if (
    !r.project_snapshot ||
    typeof r.project_snapshot !== "object" ||
    Array.isArray(r.project_snapshot)
  ) {
    return {
      ok: false,
      error: "project_snapshot is required and must be an object.",
      field: "project_snapshot",
    };
  }

  return {
    ok: true,
    value: {
      tier: r.tier as OrderTier,
      customer_name: readStr(r.customer_name),
      customer_phone: readStr(r.customer_phone),
      customer_email: readStr(r.customer_email),
      project_snapshot: r.project_snapshot as Record<string, unknown>,
    },
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "invalid_json" },
      { status: 400 },
    );
  }

  const v = validateInput(body);
  if (!v.ok) {
    return NextResponse.json(
      { error: v.error, code: "invalid_input", field: v.field },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Server not configured for orders. Supabase credentials missing.",
        code: "config_missing",
      },
      { status: 503 },
    );
  }

  const tier = v.value.tier;
  const price_mnt = TIER_PRICES[tier];

  // Retry on order_code unique-violation (Postgres SQLSTATE 23505).
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const order_code = generateOrderCode();
    const { data, error } = await supabase
      .from("report_orders")
      .insert({
        order_code,
        tier,
        price_mnt,
        status: "pending_payment",
        customer_name: v.value.customer_name,
        customer_phone: v.value.customer_phone,
        customer_email: v.value.customer_email,
        project_snapshot: v.value.project_snapshot,
      })
      .select("order_code, status, price_mnt")
      .single();

    if (!error && data) {
      return NextResponse.json({
        order_code: data.order_code,
        status: data.status,
        price_mnt: data.price_mnt,
      });
    }

    // Retry only on order_code collision; other DB errors are fatal.
    if (error && error.code === "23505") continue;

    if (process.env.NODE_ENV !== "production") {
      console.error("[orders/create] insert error:", error);
    }
    return NextResponse.json(
      { error: "Failed to create order.", code: "db_error" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error: "Could not generate unique order code. Try again.",
      code: "code_collision",
    },
    { status: 500 },
  );
}
