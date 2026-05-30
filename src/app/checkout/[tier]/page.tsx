"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Shield,
  ArrowRight,
  AlertTriangle,
  FileQuestion,
} from "lucide-react";
import { useProjectStore } from "@/hooks/useProject";
import {
  TIER_PRICES,
  TIER_LABELS,
  TIER_BILLING,
  VALID_TIERS,
  type OrderTier,
} from "@/lib/orders";
import { DISCLAIMER_TEXT } from "@/lib/constants";

const TIER_DESCRIPTIONS: Record<OrderTier, string> = {
  full_pdf:
    "9 шаттай бүрэн roadmap, 30–50 даалгаврын checklist, төсвийн задаргаа, материалын тооцоо, эрсдэлийн жагсаалт — нэг PDF тайлан.",
  premium:
    "Төсөл чинь өөрчлөгдөх бүрд тааруулсан амьд AI зөвлөгч: газар, материал, төсвийн өөрчлөлтөд шинэчлэгдэх зөвлөгөө, сонголт харьцуулах, хязгааргүй контекст-аваре асуулт. Сар бүрийн хандалт.",
  consultation:
    "Амьд AI зөвлөгчийн багц дээр 1 цаг видео уулзалт, таны нөхцөлд тохируулсан хувийн зөвлөгөө, дараа email-ээр follow-up.",
};

type Status = "idle" | "submitting" | "error";

function isTier(v: string | undefined): v is OrderTier {
  return typeof v === "string" && (VALID_TIERS as readonly string[]).includes(v);
}

export default function CheckoutPage({
  params,
}: {
  params: { tier: string };
}) {
  const router = useRouter();
  const rawTier = params.tier;

  const { hasHydrated, questionnaire, assessment } = useProjectStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // ── Invalid tier ──
  if (!isTier(rawTier)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Багц олдсонгүй
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            &laquo;{rawTier}&raquo; гэсэн багц байхгүй. Үнийн хуудаснаас сонгоно
            уу.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Үнийн санал
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const tier: OrderTier = rawTier;

  // ── Waiting for Zustand persist hydration ──
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Ачааллаж байна…</p>
        </div>
      </div>
    );
  }

  // ── No project data ──
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Эхлээд асуумжаа бөглөнө үү
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Захиалга үүсгэхийн тулд таны төслийн мэдээллийг хадгалсан байх ёстой.
            3–4 минут болно.
          </p>
          <Link
            href="/questionnaire"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Асуумж бөглөх
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          customer_name: name.trim() || null,
          customer_phone: phone.trim() || null,
          customer_email: email.trim() || null,
          project_snapshot: {
            questionnaire,
            assessment,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Захиалга үүсгэхэд алдаа гарлаа.");
      }
      router.push(`/orders/${data.order_code}`);
    } catch (err) {
      console.error("[checkout] order create failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Алдаа гарлаа. Дахин оролдоно уу.",
      );
      setStatus("error");
    }
  }

  const price = TIER_PRICES[tier];
  const label = TIER_LABELS[tier];
  const description = TIER_DESCRIPTIONS[tier];

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Захиалга үүсгэх
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Мэдээллийг бөглөвөл захиалгын код үүсэх ба төлбөрийн заавар харагдана.
        </p>

        {/* Tier summary */}
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">{label}</h2>
            <span className="text-xl font-bold text-brand-700">
              ₮{price.toLocaleString("mn-MN")}
              {TIER_BILLING[tier] === "monthly" && (
                <span className="text-sm font-normal text-gray-400 ml-0.5">
                  /сар
                </span>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          {TIER_BILLING[tier] === "monthly" && (
            <p className="text-xs text-gray-400 mt-2">
              Эхний сарын хандалт. Сунгахдаа дараа сард дахин шилжүүлнэ.
            </p>
          )}
        </div>

        {/* Customer form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Нэр{" "}
              <span className="text-gray-400 text-xs font-normal">
                (сонголттой)
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Жишээ: Бат-Эрдэнэ"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Утас{" "}
              <span className="text-gray-400 text-xs font-normal">
                (сонголттой)
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              placeholder="9911-XXXX"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              И-мэйл{" "}
              <span className="text-gray-400 text-xs font-normal">
                (сонголттой — хандалт нээх мэдэгдэлд хэрэгтэй)
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none"
            />
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Холбоо барих мэдээлэл нь зөвхөн төлбөрийн баталгаажуулалт болон
            зөвлөгчийн хандалт нээх мэдэгдэлд хэрэглэгдэнэ.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Үүсгэж байна…
              </>
            ) : (
              <>
                Захиалга үүсгэх
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mt-6 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}
