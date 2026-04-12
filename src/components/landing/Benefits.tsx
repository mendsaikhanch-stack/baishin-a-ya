import { Compass, ShieldCheck, Clock, PiggyBank } from "lucide-react";

const BENEFITS = [
  {
    icon: Compass,
    title: "Андуурахгүй",
    description: "Алхам алхмаар тодорхой зааварчилгаа авна.",
  },
  {
    icon: ShieldCheck,
    title: "Алдаа багасна",
    description: "Нийтлэг алдаануудаас зайлсхийх зөвлөмж.",
  },
  {
    icon: Clock,
    title: "Цаг хэмнэнэ",
    description: "Бүх мэдээлэл нэг дороос, хайх шаардлагагүй.",
  },
  {
    icon: PiggyBank,
    title: "Мөнгө хэмнэнэ",
    description: "Төсвийн зөв төлөвлөлт, шаардлагагүй зардлаас зайлсхийх.",
  },
];

export default function Benefits() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Яагаад Байшин А-Я?
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-xl border border-gray-100 p-5 text-center card-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {b.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
