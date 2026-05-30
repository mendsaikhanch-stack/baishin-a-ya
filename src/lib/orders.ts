// ============================================================
// Байшин А-Я — Report order types & constants (shared client+server)
// Server-only тэмдэглэлүүд (жнь. order_code generator) ./orders.server.ts-д.
// ============================================================

// full_pdf нь retired (PDF одоо үнэгүй export — /api/report/pdf). Хуучин
// захиалгуудыг харуулахын тулд type/map-д үлдээсэн ч шинээр захиалах боломжгүй
// (VALID_TIERS-д ороогүй). premium = "Амьд AI зөвлөгч" (сар бүрийн subscription).
export type OrderTier = "full_pdf" | "premium" | "consultation";

// Захиалгын төлбөрийн давтамж
export type TierBilling = "once" | "monthly";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "unlocked"
  | "cancelled";

// Шинээр захиалж болох tier-ууд (full_pdf retired — PDF үнэгүй болсон).
export const VALID_TIERS: readonly OrderTier[] = [
  "premium",
  "consultation",
] as const;

export const VALID_STATUSES: readonly OrderStatus[] = [
  "pending_payment",
  "paid",
  "unlocked",
  "cancelled",
] as const;

// Зөвшөөрөгдсөн төлвийн шилжилт. Бусад бүх шилжилт хориглогдоно.
export const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["unlocked", "cancelled"],
  unlocked: [],
  cancelled: [],
} as const;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Төлбөр хүлээгдэж буй",
  paid: "Төлбөр баталгаажсан",
  unlocked: "Хандалт нээгдсэн",
  cancelled: "Цуцлагдсан",
};

export const TIER_PRICES: Record<OrderTier, number> = {
  full_pdf: 0, // retired — PDF үнэгүй
  premium: 19_900, // Амьд AI зөвлөгч — сар бүр
  consultation: 299_000, // Хувийн зөвлөгөө — нэг удаа
};

export const TIER_LABELS: Record<OrderTier, string> = {
  full_pdf: "Бүрэн PDF тайлан",
  premium: "Амьд AI зөвлөгч",
  consultation: "Хувийн зөвлөгөө",
};

export const TIER_BILLING: Record<OrderTier, TierBilling> = {
  full_pdf: "once",
  premium: "monthly",
  consultation: "once",
};

export interface ReportOrder {
  id: string;
  order_code: string;
  tier: OrderTier;
  price_mnt: number;
  status: OrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  project_snapshot: unknown;
  payment_note: string | null;
  admin_note: string | null;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  tier: OrderTier;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  project_snapshot: Record<string, unknown>;
}

export interface CreateOrderResponse {
  order_code: string;
  status: OrderStatus;
  price_mnt: number;
}

// Хүний нүдээр уншихад тохиромжтой код: BA-YYYYMM-XXXX
// I/O/0/1 хасагдсан — хольж бичих эрсдэлгүй.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Захиалгын кодын форматын regex (API route-уудад validate-д ашиглана).
export const ORDER_CODE_RE = /^BA-\d{6}-[A-Z2-9]{4}$/;
