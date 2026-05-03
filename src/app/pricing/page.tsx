"use client";

import { useState } from "react";
import { Check, X, Star, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    tagline: "Үндсэн тооцоо",
    price: "₮0",
    period: "",
    included: [
      "Үндсэн үнийн диапазон",
      "Хугацааны тооцоо",
      "Гол 2 материал",
      "Өдөрт 3 хүртэл тооцоо",
    ],
    excluded: [
      "AI advisor (summary, suggestion, warning)",
      "Margin задаргаа (profit, contingency, VAT)",
      "Бүх 5 материал",
      "Тооцооны түүх",
    ],
    popular: false,
    comingSoon: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    tagline: "Бүрэн боломж + AI зөвлөгч",
    price: "$9.99",
    period: " / сар",
    included: [
      "Хязгааргүй тооцоо",
      "AI advisor (summary + suggestion + warning)",
      "Margin бүрэн задаргаа (profit, contingency, VAT)",
      "Улирлын засвар (өвөл/зун)",
      "Бүх 5 материалын задаргаа",
      "Тооцооны түүх (хадгалагдана)",
    ],
    excluded: [],
    popular: true,
    comingSoon: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/pricing";
          return;
        }
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe checkout URL ирсэнгүй.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Багцын үнэ
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Free-ээр эхлэн бэлэн болмогц Pro-руу шилжээрэй. Цуцлах боломжтой.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-white rounded-2xl border flex flex-col overflow-hidden",
                plan.popular
                  ? "border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500 relative"
                  : "border-gray-200",
              )}
            >
              {plan.popular && (
                <div className="bg-brand-600 text-white text-xs font-medium text-center py-1.5 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  Санал болгож буй
                </div>
              )}

              <div className="p-6 flex-1">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.tagline}</p>

                <div className="mt-5 mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {plan.included.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                {plan.id === "free" ? (
                  <a
                    href="/estimate"
                    className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Үнэгүй эхлэх
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={subscribe}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Шилжүүлж байна..." : "Pro захиалах"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}

        <div className="my-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Хүссэн үедээ цуцлах
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Account хуудаснаас Pro захиалгаа хүссэн үедээ зогсоох
                  боломжтой. Цуцалсан тохиолдолд төлсөн хугацааны эцэс хүртэл Pro
                  үргэлжилнэ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
