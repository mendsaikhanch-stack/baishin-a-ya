import {
  ClipboardCheck,
  Route,
  CheckSquare,
  MessageCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Бэлэн байдлын шалгалт",
    description:
      "Та байшин барихад бэлэн үү? Хурдан шалгалтаар тодорхойлно.",
  },
  {
    icon: Route,
    title: "Хувийн төлөвлөгөө",
    description:
      "Таны төсөв, газар, хугацаанд тохирсон алхам алхмаар төлөвлөгөө.",
  },
  {
    icon: CheckSquare,
    title: "Ухаалаг шалгах хуудас",
    description:
      "Юу хийсэн, юу хийх вэ гэдгийг бүрэн хянах боломж.",
  },
  {
    icon: MessageCircle,
    title: "AI зөвлөгч",
    description:
      "Байшин барилгатай холбоотой асуултандаа хариулт аваарай.",
  },
];

export default function Features() {
  return (
    <section className="section-padding bg-white">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Байшин А-Я яаж туслах вэ?
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Таны нөхцөлд тохируулсан ухаалаг төлөвлөлтийн туслах
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-gray-100 card-shadow bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
