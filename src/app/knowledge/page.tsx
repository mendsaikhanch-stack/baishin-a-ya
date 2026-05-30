import {
  BookOpen,
  MapPin,
  Calculator,
  Ruler,
  Layers,
  Building,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import t from "@/i18n/mn";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, MapPin, Calculator, Ruler, Layers, Building, Calendar, Users, AlertTriangle, CheckCircle,
};

const ARTICLES = [
  {
    category: "before_starting",
    icon: "BookOpen",
    title: "Эхлэхээс өмнө мэдэх зүйлс",
    articles: [
      { title: "Байшин барихын өмнө юуг бодох вэ?", slug: "before-starting-guide" },
      { title: "Хамгийн нийтлэг 10 алдаа", slug: "top-10-mistakes" },
      { title: "Ямар зөвшөөрөл хэрэгтэй вэ?", slug: "required-permits" },
    ],
  },
  {
    category: "land_selection",
    icon: "MapPin",
    title: "Газар сонголт",
    articles: [
      { title: "Газар хэрхэн сонгох вэ?", slug: "how-to-choose-land" },
      { title: "Газрын эрхийн бичиг шалгах", slug: "land-rights-check" },
      { title: "Хот vs хөдөө: ялгаа юу вэ?", slug: "urban-vs-rural" },
    ],
  },
  {
    category: "budget_planning",
    icon: "Calculator",
    title: "Төсөв төлөвлөлт",
    articles: [
      { title: "Байшингийн зардал хэрхэн тооцоолох?", slug: "budget-calculation" },
      { title: "Далд зардлууд: юуг орхигдуулдаг вэ?", slug: "hidden-costs" },
      { title: "Зээлийн нөхцөл харьцуулалт", slug: "loan-comparison" },
    ],
  },
  {
    category: "material_selection",
    icon: "Layers",
    title: "Материал сонголт",
    articles: [
      { title: "Тоосго, блок, каркас: аль нь дээр вэ?", slug: "material-comparison" },
      { title: "Дулаалгын материал хэрхэн сонгох?", slug: "insulation-guide" },
      { title: "Дээврийн материалын харьцуулалт", slug: "roofing-comparison" },
    ],
  },
  {
    category: "foundation",
    icon: "Building",
    title: "Суурь",
    articles: [
      { title: "Суурийн төрлүүд ба сонголт", slug: "foundation-types" },
      { title: "Хөлдөлтийн гүн: яагаад чухал вэ?", slug: "frost-depth" },
      { title: "Суурийн нийтлэг алдаанууд", slug: "foundation-mistakes" },
    ],
  },
  {
    category: "seasonal_timing",
    icon: "Calendar",
    title: "Улирлын төлөвлөлт",
    articles: [
      { title: "Хэзээ эхлэх нь зөв вэ?", slug: "best-time-to-start" },
      { title: "Өвлийн барилгын онцлог", slug: "winter-construction" },
      { title: "Барилгын хуваарь гаргах", slug: "construction-schedule" },
    ],
  },
];

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t.knowledge.title}
          </h1>
          <p className="text-gray-500">{t.knowledge.subtitle}</p>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {ARTICLES.map((category) => {
            const IconComponent = ICON_MAP[category.icon] || BookOpen;
            return (
              <div key={category.category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {category.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {category.articles.map((article) => (
                    <div
                      key={article.slug}
                      className="bg-white p-4 rounded-xl border border-gray-100 card-shadow"
                    >
                      <h3 className="text-sm font-medium text-gray-900">
                        {article.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 mt-2 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Тун удахгүй
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming soon note */}
        <div className="mt-10 text-center py-8 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Илүү олон нийтлэл тун удахгүй нэмэгдэнэ
          </p>
        </div>
      </div>
    </div>
  );
}
