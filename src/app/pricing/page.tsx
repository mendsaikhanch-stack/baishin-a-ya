import Link from "next/link";
import { Check, Star, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISCLAIMER_TEXT } from "@/lib/constants";

type Plan = {
  id: "free" | "full_pdf" | "premium" | "consultation";
  name: string;
  tagline: string;
  price: string;
  /** Үнийн дараах нэгж, ж: "сар" → "/сар" */
  period?: string;
  href: string;
  cta: string;
  features: readonly string[];
  popular?: boolean;
};

const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Үнэгүй",
    tagline: "Бүрэн төлөвлөгөө",
    price: "₮0",
    href: "/questionnaire",
    cta: "Шалгалт эхлэх",
    features: [
      "Бэлэн байдлын оноо & төсвийн муж",
      "9 шаттай бүрэн roadmap",
      "30–50 даалгаврын checklist",
      "Гол эрсдэлүүд",
      "Төлөвлөгөөгөө PDF-ээр татах",
    ],
  },
  {
    id: "premium",
    name: "Амьд AI зөвлөгч",
    tagline: "Өөрчлөлт болгонд тааруулна",
    price: "₮19,900",
    period: "сар",
    href: "/checkout/premium",
    cta: "Зөвлөгч идэвхжүүлэх",
    features: [
      "Өөрчлөлт болгонд шинэчлэгдэх зөвлөгөө",
      "Сонголтуудыг харьцуулж тооцох",
      "Хязгааргүй AI асуулт (контекстийг мэдсэн)",
      "Төсөл дуустал тогтмол хандалт",
    ],
    popular: true,
  },
  {
    id: "consultation",
    name: "Хувийн зөвлөгөө",
    tagline: "Мэргэжлийн хүн",
    price: "₮299,000",
    href: "/checkout/consultation",
    cta: "Зөвлөгөө захиалах",
    features: [
      "Амьд AI зөвлөгчийн багц",
      "1 цаг видео уулзалт",
      "Таны нөхцөлд тохирсон зөвлөгөө",
      "Дараа email follow-up",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Багцын үнэ
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Бүрэн төлөвлөгөө, roadmap, checklist, PDF татах — бүгд үнэгүй.
            Төсөл чинь өөрчлөгдөх бүрд тааруулсан амьд AI зөвлөгчийг сар бүрээр
            нэмж аваарай.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
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
                    <span className="text-sm text-gray-400 ml-1">
                      /{plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={plan.href}
                  className={cn(
                    "flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-semibold transition-colors",
                    plan.id === "free"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-brand-600 text-white hover:bg-brand-700",
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="my-10 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Гар аргаар төлбөр баталгаажуулна
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Захиалга үүсгэсний дараа банкны шилжүүлгийн заавар харагдана.
                  Манай баг төлбөрийг шалгаад нэг ажлын өдрийн дотор зөвлөгчийн
                  хандалтыг нээнэ. Сэтгэл ханамжгүй бол 7 хоногийн дотор бүрэн
                  буцаалт.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {DISCLAIMER_TEXT}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
