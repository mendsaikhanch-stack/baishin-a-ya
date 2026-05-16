"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Unlock,
  Lock,
  Copy,
  ArrowRight,
  ShieldAlert,
  LogIn,
  FileDown,
} from "lucide-react";
import {
  TIER_LABELS,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  type OrderStatus,
  type OrderTier,
} from "@/lib/orders";

type AdminOrder = {
  order_code: string;
  tier: OrderTier;
  price_mnt: number;
  status: OrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  payment_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  unlocked_at: string | null;
  pdf_path: string | null;
  pdf_generated_at: string | null;
};

type AuthState = "checking" | "ok" | "unauthenticated" | "forbidden";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  unlocked: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "pending_payment", label: "Хүлээгдэж буй" },
  { value: "paid", label: "Төлсөн" },
  { value: "unlocked", label: "Нээгдсэн" },
  { value: "cancelled", label: "Цуцлагдсан" },
];

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filter === "all"
          ? "/api/admin/orders"
          : `/api/admin/orders?status=${filter}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (res.status === 403) {
        setAuthState("forbidden");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders.");
      setOrders(data.orders as AdminOrder[]);
      setAuthState("ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Нэвтэрсэн байх шаардлагатай
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Админ хуудсанд хандахын тулд эхлээд OTP-р нэвтэрнэ үү.
          </p>
          <Link
            href="/login?next=/admin/orders"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Нэвтрэх
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (authState === "forbidden") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Хандалт хориглогдсон
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Энэ хэрэглэгчийн email админы жагсаалтад байхгүй байна. Системийн
            админтай холбогдоно уу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Захиалгын удирдлага
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manual төлбөр баталгаажуулалт + PDF unlock
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 disabled:opacity-50"
            title="Шинэчлэх"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Шинэчлэх</span>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                filter === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Body */}
        {loading && authState === "checking" ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Ачааллаж байна…
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
            Захиалга байхгүй байна.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow key={order.order_code} order={order} onUpdate={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  onUpdate,
}: {
  order: AdminOrder;
  onUpdate: () => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allowed = STATUS_TRANSITIONS[order.status];

  async function changeStatus(target: OrderStatus, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setSubmitting(true);
    setActionError(null);
    setActionWarning(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.order_code)}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: target,
            admin_note: note.trim() || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Үйлдэл амжилтгүй боллоо.");
      setNote("");

      // Unlock үед сервэр inline PDF үүсгэх оролдлого хийсэн. Амжилтгүй
      // бол захиалгыг нээсэн ч PDF алга байгааг admin-д харуулна.
      if (data.pdf && data.pdf.generated === false) {
        setActionWarning(
          `Захиалга нээгдсэн боловч PDF үүсгэхэд алдаа гарлаа: ${data.pdf.error}. ` +
            `Доорх "PDF дахин үүсгэх" товчоор дахин оролдоно уу.`,
        );
      }
      onUpdate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(order.order_code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {
        /* ignore */
      },
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Top row: code + status + price */}
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <code className="text-base font-bold text-gray-900 tracking-wider">
                {order.order_code}
              </code>
              <button
                onClick={copyCode}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                aria-label="Кодыг хуулах"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[order.status]}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {TIER_LABELS[order.tier]} · {formatDateTime(order.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-brand-700">
              ₮{order.price_mnt.toLocaleString("mn-MN")}
            </p>
          </div>
        </div>

        {/* Customer */}
        {(order.customer_name ||
          order.customer_phone ||
          order.customer_email) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm bg-gray-50 rounded-lg p-3 mb-3">
            {order.customer_name && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Нэр
                </p>
                <p className="text-gray-800">{order.customer_name}</p>
              </div>
            )}
            {order.customer_phone && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Утас
                </p>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-brand-700 hover:underline"
                >
                  {order.customer_phone}
                </a>
              </div>
            )}
            {order.customer_email && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  И-мэйл
                </p>
                <a
                  href={`mailto:${order.customer_email}`}
                  className="text-brand-700 hover:underline break-all"
                >
                  {order.customer_email}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {(order.payment_note || order.admin_note) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-brand-600 hover:underline mb-2"
          >
            {expanded ? "Тэмдэглэлийг хаах" : "Тэмдэглэл харах"}
          </button>
        )}
        {expanded && (
          <div className="space-y-2 mb-3">
            {order.payment_note && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-[10px] text-blue-600 uppercase tracking-wide mb-1">
                  Хэрэглэгчийн тэмдэглэл
                </p>
                <pre className="text-xs text-blue-900 whitespace-pre-wrap font-sans">
                  {order.payment_note}
                </pre>
              </div>
            )}
            {order.admin_note && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                  Админы тэмдэглэл
                </p>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans">
                  {order.admin_note}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {allowed.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Админы тэмдэглэл (сонголттой) — үйлдэлтэй хамт хадгалагдана"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
            />
            <div className="flex gap-2 flex-wrap">
              {allowed.includes("paid") && (
                <button
                  onClick={() => changeStatus("paid")}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Төлбөр баталгаажуулах
                </button>
              )}
              {allowed.includes("unlocked") && (
                <button
                  onClick={() =>
                    changeStatus(
                      "unlocked",
                      "Захиалгыг нээж PDF үүсгэх үү? Энэ үйлдэл буцаагдахгүй.",
                    )
                  }
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                  title="Захиалгыг нээгээд PDF тайланг автоматаар үүсгэнэ"
                >
                  <Unlock className="w-4 h-4" />
                  Нээх + PDF
                </button>
              )}
              {allowed.includes("cancelled") && (
                <button
                  onClick={() =>
                    changeStatus("cancelled", "Захиалгыг цуцлах уу?")
                  }
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Цуцлах
                </button>
              )}
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 self-center" />
              )}
            </div>
            {actionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2 text-xs text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{actionWarning}</span>
              </div>
            )}
          </div>
        )}

        {/* Terminal-state info */}
        {allowed.length === 0 && (
          <div className="border-t border-gray-100 pt-3 mt-3 text-xs text-gray-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            {order.status === "unlocked"
              ? `Нээгдсэн: ${order.unlocked_at ? formatDateTime(order.unlocked_at) : "—"}`
              : "Захиалга цуцлагдсан — өөрчилж болохгүй."}
          </div>
        )}

        {/* PDF generation — only for unlocked orders */}
        {order.status === "unlocked" && (
          <PdfPanel order={order} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}

function PdfPanel({
  order,
  onUpdate,
}: {
  order: AdminOrder;
  onUpdate: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState(false);

  async function generate() {
    setGenerating(true);
    setGenError(null);
    setGenSuccess(false);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.order_code)}/pdf`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PDF үүсгэхэд алдаа гарлаа.");
      setGenSuccess(true);
      onUpdate();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setGenerating(false);
    }
  }

  const hasPdf = Boolean(order.pdf_path);

  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <FileDown className="w-4 h-4 text-brand-600" />
        <p className="text-xs font-semibold text-gray-800">PDF тайлан</p>
        {hasPdf ? (
          order.pdf_generated_at && (
            <span className="text-[10px] text-gray-400">
              (үүсгэгдсэн: {formatDateTime(order.pdf_generated_at)})
            </span>
          )
        ) : (
          <span className="text-[10px] text-amber-700">
            (Unlock үед үүсээгүй — дахин үүсгэх шаардлагатай)
          </span>
        )}
      </div>

      <button
        onClick={generate}
        disabled={generating}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
          hasPdf
            ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Үүсгэж байна…
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            {hasPdf ? "PDF дахин үүсгэх" : "PDF үүсгэх"}
          </>
        )}
      </button>

      {genSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2 flex items-start gap-2 text-xs text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>PDF амжилттай үүсгэгдлээ. Хэрэглэгч одоо татаж авч чадна.</span>
        </div>
      )}
      {genError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 flex items-start gap-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{genError}</span>
        </div>
      )}
    </div>
  );
}
