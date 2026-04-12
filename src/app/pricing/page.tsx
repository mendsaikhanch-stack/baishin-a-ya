import Link from "next/link";
import { Check, X, Star, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import t from "@/i18n/mn";

const PLANS = [
  {
    id: "free",
    name: t.pricing.free.name,
    price: t.pricing.free.price,
    period: "",
    features: t.pricing.free.features,
    excluded: [
      "Бүрэн хувийн төлөвлөгөө",
      "Дэлгэрэнгүй шалгах хуудас",
      "AI зөвлөгч (хязгааргүй)",
      "Татаж авах боломжтой тайлан",
    ],
    cta: t.pricing.free.cta,
    ctaLink: "/questionnaire",
    popular: false,
    comingSoon: false,
  },
  {
    id: "paid",
    name: t.pricing.paid.name,
    price: t.pricing.paid.price,
    period: t.pricing.paid.period,
    features: t.pricing.paid.features,
    excluded: [],
    cta: t.pricing.paid.cta,
    ctaLink: "#",
    popular: true,
    comingSoon: false,
  },
  {
    id: "premium",
    name: t.pricing.premium.name,
    price: t.pricing.premium.price,
    period: t.pricing.premium.period,
    features: t.pricing.premium.features,
    excluded: [],
    cta: t.pricing.premium.cta,
    ctaLink: "#",
    popular: false,
    comingSoon: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-app max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t.pricing.title}
          </h1>
          <p className="text-gray-500">{t.pricing.subtitle}</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-white rounded-2xl border overflow-hidden flex flex-col",
                plan.popular
                  ? "border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500 relative"
                  : "border-gray-200"
              )}
            >
              {plan.popular && (
                <div className="bg-brand-600 text-white text-xs font-medium text-center py-1.5 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  Хамгийн их сонгодог
                </div>
              )}

              {plan.comingSoon && (
                <div className="bg-gray-100 text-gray-500 text-xs font-medium text-center py-1.5">
                  Тун удахгүй
                </div>
              )}

              <div className="p-6 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  )}
                </div>

                {/* Included features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.excluded.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={plan.ctaLink}
                  className={cn(
                    "block w-full text-center py-3 rounded-lg font-medium transition-colors",
                    plan.popular
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : plan.comingSoon
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ note */}
        <div className="mt-10 text-center">
          <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <Shield className="w-5 h-5 text-brand-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  Төлбөрийн баталгаа
                </h3>
                <p className="text-sm text-gray-500">
                  Хэрэв үйлчилгээнд сэтгэл ханамжгүй бол 7 хоногийн дотор
                  мөнгөө буцааж авах боломжтой.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
