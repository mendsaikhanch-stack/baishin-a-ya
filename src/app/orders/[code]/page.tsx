"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Shield,
  CheckCircle2,
  Copy,
  AlertTriangle,
  ArrowRight,
  Send,
  CreditCard,
  FileDown,
  MessageCircle,
  Sparkles,
  Route,
} from "lucide-react";
import { TIER_LABELS, type OrderTier, type OrderStatus } from "@/lib/orders";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import BankApps from "@/components/payment/BankApps";

type OrderSafe = {
  order_code: string;
  tier: OrderTier;
  price_mnt: number;
  status: OrderStatus;
  created_at: string;
};

// Banking details — Vercel env-ээр тохируулна (NEXT_PUBLIC_*).
// Prod-д заавал бодит утга тавь, эс бөгөөс placeholder харагдана.
const BANK_DETAILS = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || "Хаан банк",
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "5XXX XXXX XXXX",
  holder: process.env.NEXT_PUBLIC_BANK_HOLDER || "БОСГО ХХК",
};

const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
  pending_payment: {
    label: "Төлбөр хүлээгдэж буй",
    cls: "bg-amber-100 text-amber-700",
  },
  paid: { label: "Төлбөр баталгаажсан", cls: "bg-blue-100 text-blue-700" },
  unlocked: { label: "Хандалт нээгдсэн", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Цуцлагдсан", cls: "bg-red-100 text-red-700" },
};

// Төлбөр баталгаажиж нээгдсэний дараах "Зөвлөгч идэвхжлээ" нүүр —
// хэрэглэгчийг амьд бүтээгдэхүүн (чат, төлөвлөгөө) рүү аваачна.
// PDF татах нь зөвхөн нэмэлт (үнэгүй) сонголт болж үлдсэн.
function AdvisorActivePanel({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadPdf() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(code)}/download`,
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "not_ready") {
          throw new Error(
            "Тайлан одоохондоо бэлэн биш байна. Манай баг удахгүй үүсгэнэ.",
          );
        }
        throw new Error(data.error || "Татах линк авч чадсангүй.");
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 sm:p-6">
      {/* Celebration header */}
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">
          🎉 Таны амьд AI зөвлөгч идэвхжлээ!
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Төсөл чинь өөрчлөгдөх бүрд хажууд чинь байж, таны нөхцөлд тааруулсан
          зөвлөгөө өгнө.
        </p>
        <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full bg-success-50 text-success-600 text-[11px] font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Сарын хандалт идэвхтэй
        </span>
      </div>

      {/* Primary CTAs — амьд бүтээгдэхүүн рүү */}
      <div className="space-y-2.5">
        <Link
          href="/chat"
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Зөвлөгчтэйгөө ярих
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/results"
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-brand-200 text-brand-700 font-semibold rounded-xl hover:border-brand-300 transition-colors"
        >
          <Route className="w-4 h-4" />
          Төлөвлөгөө рүүгээ очих
        </Link>
        <button
          onClick={downloadPdf}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Бэлдэж байна…
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Тайлан татах (үнэгүй)
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3 flex items-start gap-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function OrderPage({ params }: { params: { code: string } }) {
  const code = (params.code ?? "").toUpperCase();
  const [order, setOrder] = useState<OrderSafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Захиалга олдсонгүй.");
        if (!cancelled) setOrder(data as OrderSafe);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleNotify() {
    if (!note.trim()) {
      setNotifyError("Тэмдэглэлээ бичнэ үү.");
      return;
    }
    setNotifyStatus("submitting");
    setNotifyError(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(code)}/notify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_note: note }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Илгээхэд алдаа гарлаа.");
      setNotifyStatus("sent");
      setNote("");
    } catch (e) {
      setNotifyError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      setNotifyStatus("error");
    }
  }

  function copyCode() {
    if (!order) return;
    navigator.clipboard?.writeText(order.order_code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        /* clipboard unavailable — silently ignore */
      },
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Захиалгыг ачааллаж байна…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Захиалга олдсонгүй
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            {error || "Энэ код хүчингүй эсвэл устгагдсан байж магадгүй."}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Үнийн санал руу буцах
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[order.status];
  const isPending = order.status === "pending_payment";

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-lg mx-auto px-4 space-y-5">
        {/* Order summary card */}
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 sm:p-6">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
            Захиалгын код
          </p>
          <div className="flex items-center gap-2 mb-4">
            <code className="text-xl sm:text-2xl font-bold text-gray-900 tracking-wider">
              {order.order_code}
            </code>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Кодыг хуулах"
              title="Кодыг хуулах"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Багц</p>
              <p className="font-medium text-gray-800">
                {TIER_LABELS[order.tier]}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Дүн</p>
              <p className="font-bold text-brand-700">
                ₮{order.price_mnt.toLocaleString("mn-MN")}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-gray-400 mb-1">Төлөв</p>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Payment instructions */}
        {isPending && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-gray-900">
                Төлбөрийн заавар
              </h2>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Доорх дансанд төлбөрөө шилжүүлээрэй.{" "}
              <strong className="text-gray-900">Гүйлгээний утга</strong>{" "}
              талбарт{" "}
              <strong className="text-brand-700">{order.order_code}</strong>{" "}
              гэж заавал бичнэ үү — энэ нь таны захиалгыг танихад хэрэгтэй.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 flex-shrink-0">Банк:</span>
                <span className="font-medium text-gray-800 text-right">
                  {BANK_DETAILS.bank}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 flex-shrink-0">
                  Дансны дугаар:
                </span>
                <span className="font-mono font-medium text-gray-800 text-right">
                  {BANK_DETAILS.account}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 flex-shrink-0">
                  Хүлээн авагч:
                </span>
                <span className="font-medium text-gray-800 text-right">
                  {BANK_DETAILS.holder}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-gray-200 pt-2.5">
                <span className="text-gray-500 flex-shrink-0">Дүн:</span>
                <span className="font-bold text-brand-700 text-right">
                  ₮{order.price_mnt.toLocaleString("mn-MN")}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 flex-shrink-0">
                  Гүйлгээний утга:
                </span>
                <span className="font-mono font-bold text-brand-700 text-right">
                  {order.order_code}
                </span>
              </div>
            </div>

            <BankApps />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4 text-xs text-blue-700 leading-relaxed">
              ℹ️ Төлбөр баталгаажуулах ажлыг манай баг гар аргаар хийдэг тул
              нэг ажлын өдрийн дотор хариу мэдэгдэнэ. Auto-баталгаажуулалт
              байхгүй.
            </div>
          </div>
        )}

        {/* Notify admin */}
        {isPending && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Төлбөр хийсэн үү?
            </h2>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              Гүйлгээний дэлгэрэнгүй (огноо, шилжүүлсэн дүн, хэн нэрсээр) бичээд
              илгээвэл манай баг хурдан баталгаажуулна. Захиалгын төлөв нь
              шалгалт хийгдэх хүртэл өөрчлөгдөхгүй.
            </p>

            {notifyStatus === "sent" ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Тэмдэглэл хүлээн авлаа. Манай баг шалгаад баталгаажуулна.
                </span>
              </div>
            ) : (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Жишээ: 2026.05.16-нд Хаан банкаар 49,900₮ Бат-Эрдэнэ нэрээр шилжүүллээ. Гүйлгээний дугаар: 1234567"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">
                    {note.length} / 1000
                  </p>
                  {notifyError && (
                    <p className="text-[11px] text-red-600">{notifyError}</p>
                  )}
                </div>
                <button
                  onClick={handleNotify}
                  disabled={notifyStatus === "submitting" || !note.trim()}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {notifyStatus === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Илгээж байна…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Мэдэгдэх
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Non-pending states */}
        {order.status === "paid" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Төлбөр баталгаажсан. Таны амьд AI зөвлөгч удахгүй идэвхжих ба энд
              орох холбоос гарч ирнэ.
            </p>
          </div>
        )}

        {order.status === "unlocked" && (
          <AdvisorActivePanel code={order.order_code} />
        )}

        {order.status === "cancelled" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Захиалга цуцлагдсан.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}
