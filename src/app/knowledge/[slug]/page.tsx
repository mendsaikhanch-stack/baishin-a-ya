import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { GUIDE_ARTICLES } from "@/content/guide-articles";
import { getGuideForDisplay } from "@/lib/knowledge/guides";

export const revalidate = 300;

// Pre-render the curated core; community articles render on demand.
export function generateStaticParams() {
  return GUIDE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getGuideForDisplay(params.slug);
  if (!article) return { title: "Мэдлэгийн сан — БОСГО" };
  return {
    title: `${article.title} — БОСГО`,
    description: article.summary,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getGuideForDisplay(params.slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen py-8">
      <div className="container-app max-w-2xl mx-auto px-4">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Мэдлэгийн сан
        </Link>

        <article className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              {article.categoryTitle}
            </span>
            <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readMinutes} мин унших
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
            {article.title}
          </h1>
          <p className="text-gray-500 mt-2">{article.summary}</p>

          <div className="mt-6 space-y-5">
            {article.sections.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="text-base font-semibold text-gray-900 mb-2">
                    {section.heading}
                  </h2>
                )}
                {section.body?.map((p, j) => (
                  <p
                    key={j}
                    className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-1 space-y-1.5">
                    {section.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="text-sm text-gray-700 leading-relaxed flex gap-2"
                      >
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-6 bg-brand-600 rounded-2xl p-6 text-center text-white">
          <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-90" />
          <p className="text-sm font-medium">
            Энэ сэдвээр өөрийн төсөлдөө тохирсон зөвлөгөө авах уу?
          </p>
          <Link
            href="/chat"
            className="inline-block mt-3 bg-white text-brand-700 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-brand-50 transition"
          >
            AI зөвлөгчтэй ярих
          </Link>
        </div>
      </div>
    </div>
  );
}
