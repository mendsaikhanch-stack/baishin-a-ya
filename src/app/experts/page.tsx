import {
  Compass,
  Building,
  MapPin,
  HardHat,
  Zap,
  Droplets,
  DollarSign,
  Scale,
  Package,
  Shield,
} from "lucide-react";
import t from "@/i18n/mn";

const ICON_MAP: Record<string, React.ElementType> = {
  Compass, Building, MapPin, HardHat, Zap, Droplets, DollarSign, Scale, Package,
};

const EXPERTS = [
  {
    id: "architect",
    name: "Архитектор",
    icon: "Compass",
    when: "Зураг төсөл хийхэд",
    description:
      "Байшингийн зураг төсөл, планировка, фасадын дизайн хийж өгнө. Барилгын зөвшөөрөл авахад заавал хэрэгтэй.",
    timing: "Газар, төсвийг шийдсэний дараа",
    priority: "Заавал" as const,
  },
  {
    id: "structural_engineer",
    name: "Бүтээцийн инженер",
    icon: "Building",
    when: "Суурь, бүтээцийн тооцоо",
    description:
      "Суурь, хана, дээврийн даац, бүтээцийн тооцоо хийнэ. Барилгын аюулгүй байдлыг хангана.",
    timing: "Зураг төслийн шатанд",
    priority: "Заавал" as const,
  },
  {
    id: "surveyor",
    name: "Геодезист",
    icon: "MapPin",
    when: "Газрын хэмжилт хийхэд",
    description:
      "Газрын хэмжилт, түвшин тогтоох, кадастрын мэдээлэл бэлдэх ажил хийнэ.",
    timing: "Зураг төсөл эхлэхээс өмнө",
    priority: "Зөвлөмж" as const,
  },
  {
    id: "contractor",
    name: "Гүйцэтгэгч компани",
    icon: "HardHat",
    when: "Барилга угсралт эхлэхэд",
    description:
      "Барилга угсралтын ажлыг бүхэлд нь эсвэл хэсэгчлэн гүйцэтгэнэ.",
    timing: "Зураг төсөл дууссаны дараа",
    priority: "Зөвлөмж" as const,
  },
  {
    id: "electrician",
    name: "Цахилгаанчин",
    icon: "Zap",
    when: "Цахилгааны систем суурилуулахад",
    description:
      "Цахилгааны утас, щит, розетка, гэрэлтүүлэг зэргийг суурилуулна.",
    timing: "Хана босгосны дараа",
    priority: "Заавал" as const,
  },
  {
    id: "plumber",
    name: "Сантехникч",
    icon: "Droplets",
    when: "Сантехникийн ажил хийхэд",
    description:
      "Усны шугам, ариутгах татуурга, халаалтын системийг суурилуулна.",
    timing: "Хана босгосны дараа",
    priority: "Заавал" as const,
  },
  {
    id: "financial_advisor",
    name: "Санхүүгийн зөвлөгч",
    icon: "DollarSign",
    when: "Зээл, төсвийн зөвлөгөө авахад",
    description:
      "Зээлийн сонголт, төсвийн төлөвлөлт, санхүүгийн стратеги боловсруулахад тусална.",
    timing: "Төсөв тогтоохоос өмнө",
    priority: "Зөвлөмж" as const,
  },
  {
    id: "lawyer",
    name: "Хуульч",
    icon: "Scale",
    when: "Газрын эрх, гэрээний асуудалд",
    description:
      "Газрын гэрээ, барилгын гэрээ, эрх зүйн асуудлаар зөвлөгөө өгнө.",
    timing: "Газар худалдаж авахаас өмнө",
    priority: "Зөвлөмж" as const,
  },
  {
    id: "supplier",
    name: "Материал нийлүүлэгч",
    icon: "Package",
    when: "Материал худалдан авахад",
    description:
      "Барилгын материалыг бөөнөөр, чанартай, тохирсон үнээр нийлүүлнэ.",
    timing: "Барилга эхлэхээс 2-4 долоо хоногийн өмнө",
    priority: "Зөвлөмж" as const,
  },
];

export default function ExpertsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t.experts.title}
          </h1>
          <p className="text-gray-500">{t.experts.subtitle}</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-amber-800">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Доорх мэдээлэл нь ерөнхий зааварчилгаа. Мэргэжилтэн холбох
            үйлчилгээ тун удахгүй нэмэгдэнэ.
          </span>
        </div>

        {/* Expert cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPERTS.map((expert) => {
            const IconComponent = ICON_MAP[expert.icon] || Compass;
            return (
              <div
                key={expert.id}
                className="bg-white rounded-xl border border-gray-100 card-shadow p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {expert.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        expert.priority === "Заавал"
                          ? "bg-danger-100 text-danger-600"
                          : "bg-brand-100 text-brand-600"
                      }`}
                    >
                      {expert.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed flex-1">
                  {expert.description}
                </p>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-600">
                      {t.experts.whenNeeded}:
                    </span>{" "}
                    {expert.timing}
                  </p>
                </div>

                <button
                  disabled
                  className="mt-3 w-full py-2 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
                >
                  {t.experts.comingSoon}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
