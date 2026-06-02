import Link from "next/link";
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
  ArrowRight,
} from "lucide-react";
import t from "@/i18n/mn";
import { getGroupedGuides } from "@/lib/knowledge/guides";

export const revalidate = 300;

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, MapPin, Calculator, Ruler, Layers, Building, Calendar, Users, AlertTriangle, CheckCircle,
};

export default async function KnowledgePage() {
  const GROUPS = await getGroupedGuides();
  return (
    <div className="min-h-screen py-8">
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
          {GROUPS.map((category) => {
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
                    <Link
                      key={article.slug}
                      href={`/knowledge/${article.slug}`}
                      className="group bg-white p-4 rounded-xl border border-gray-100 card-shadow hover:border-brand-200 hover:shadow-md transition flex flex-col"
                    >
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-brand-700">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-3 flex-1">
                        {article.summary}
                      </p>
                      <span className="text-[11px] text-brand-600 mt-3 inline-flex items-center gap-1 font-medium">
                        {t.knowledge.readMore}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA note */}
        <div className="mt-10 text-center py-8 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Тодорхой асуулт байна уу?{" "}
            <Link href="/chat" className="text-brand-600 font-medium hover:underline">
              AI зөвлөгчөөс асуу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
