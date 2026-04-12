import Link from "next/link";
import {
  Check,
  X,
  Star,
  Shield,
  Route,
  CheckSquare,
  MessageCircle,
  FileDown,
  Users,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Үнэгүй",
    tagline: "Эхний алхмаа хийх",
    price: "₮0",
    period: "",
    included: [
      "Бэлэн байдлын шалгалт",
      "Бэлэн байдлын оноо",
      "Гол эрсдэлүүд (3 хүртэл)",
      "Мэдлэгийн сангийн хандалт",
    ],
    excluded: [
      "Бүрэн алхам алхмаар төлөвлөгөө",
      "Дэлгэрэнгүй шалгах хуудас",
      "AI зөвлөгч",
      "Татаж авах тайлан",
    ],
    cta: "Үнэгүй эхлэх",
    ctaLink: "/questionnaire",
    popular: false,
    comingSoon: false,
  },
  {
    id: "paid",
    name: "Стандарт",
    tagline: "Бүрэн төлөвлөгөөтэйгөөр барилгаа эхлэх",
    price: "₮29,900",
    period: " / төсөл",
    included: [
      "Үнэгүй хувилбарын бүх боломж",
      "Бүрэн алхам алхмаар төлөвлөгөө",
      "Шат бүрийн шалгах хуудас",
      "AI зөвлөгч (хязгааргүй)",
      "Татаж авах боломжтой тайлан",
      "Төсвийн задаргаа",
      "Материалын харьцуулалт",
    ],
    excluded: [],
    cta: "Стандарт авах",
    ctaLink: "#",
    popular: true,
    comingSoon: false,
  },
  {
    id: "premium",
    name: "Премиум",
    tagline: "Мэргэжилтний дэмжлэг авах",
    price: "₮79,900",
    period: " / төсөл",
    included: [
      "Стандартын бүх боломж",
      "Мэргэжилтний хянасан тайлан",
      "Мэргэжилтэнтэй холбох үйлчилгээ",
      "Хувийн зөвлөгөө (1 удаа)",
      "Тэргүүлэх дэмжлэг",
    ],
    excluded: [],
    cta: "Тун удахгүй",
    ctaLink: "#",
    popular: false,
    comingSoon: true,
  },
];

const VALUE_POINTS = [
  {
    icon: Route,
    title: "Алхам алхмаар төлөвлөгөө",
    desc: "Таны газар, төсөв, хугацаанд тохирсон 8-9 шаттай хувийн төлөвлөгөө.",
  },
  {
    icon: CheckSquare,
    title: "Шалгах хуудас",
    desc: "Шат бүрд юу хийсэн, юу хийх вэ гэдгээ тодорхой хянах боломж.",
  },
  {
    icon: MessageCircle,
    title: "AI зөвлөгч",
    desc: "Байшин барилгатай холбоотой асуултандаа хүссэн үедээ хариулт авах.",
  },
  {
    icon: FileDown,
    title: "Татаж авах тайлан",
    desc: "Төлөвлөгөө, шалгах хуудсаа PDF хэлбэрээр хадгалж, хэвлэж авах.",
  },
  {
    icon: Users,
    title: "Мэргэжилтний зөвлөмж",
    desc: "Хэзээ, ямар мэргэжилтэнтэй холбогдох ёстойг тодорхой заана.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Өөрт тохирсон хувилбарыг сонгоно уу
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Үнэгүй шалгалтаар эхлээд, бэлэн болмогц бүрэн төлөвлөгөөгөө
            аваарай.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6">
        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-white rounded-2xl border flex flex-col overflow-hidden",
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
                {plan.comingSoon ? (
                  <span className="block w-full text-center py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed">
                    {plan.cta}
                  </span>
                ) : (
                  <Link
                    href={plan.ctaLink}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-semibold transition-colors",
                      plan.popular
                        ? "bg-brand-600 text-white hover:bg-brand-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="mt-14 mb-4">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-8">
            Стандарт хувилбарт юу багтдаг вэ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUE_POINTS.map((vp) => (
              <div
                key={vp.title}
                className="bg-white rounded-xl border border-gray-100 p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-3">
                  <vp.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {vp.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {vp.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust / guarantee */}
        <div className="my-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  7 хоногийн буцаалтын баталгаа
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Хэрэв үйлчилгээнд сэтгэл ханамжгүй бол 7 хоногийн дотор
                  мөнгөө бүрэн буцааж авах боломжтой. Ямар нэг эрсдэлгүйгээр
                  туршиж үзнэ үү.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
