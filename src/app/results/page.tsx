"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/hooks/useProject";
import { cn, getReadinessBgColor, getRiskColor } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Shield,
  Users,
  Lock,
  ChevronRight,
} from "lucide-react";
import t from "@/i18n/mn";

export default function ResultsPage() {
  const router = useRouter();
  const { assessment } = useProjectStore();

  useEffect(() => {
    if (!assessment) {
      router.push("/questionnaire");
    }
  }, [assessment, router]);

  if (!assessment) return null;

  const {
    readinessScore,
    readinessLabel,
    topRisks,
    nextSteps,
    budgetNotes,
    expertSuggestions,
    disclaimer,
  } = assessment;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t.results.title}
          </h1>
          <p className="text-gray-500">
            Таны хувийн нөхцөлд үндэслэсэн үр дүн
          </p>
        </div>

        {/* Readiness Score */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-6">
            {t.results.readiness}
          </h2>
          <div className="relative w-40 h-40 mx-auto mb-4">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(readinessScore / 100) * 339.3} 339.3`}
                className={getReadinessBgColor(readinessScore).replace("bg-", "text-")}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900">
                {readinessScore}
              </span>
              <span className="text-sm text-gray-500">/100</span>
            </div>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              readinessScore >= 65
                ? "bg-success-50 text-success-600"
                : readinessScore >= 40
                  ? "bg-warning-50 text-warning-600"
                  : "bg-danger-50 text-danger-600"
            )}
          >
            {t.results.readinessLabels[readinessLabel]}
          </div>
        </div>

        {/* Top Risks */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            {t.results.risks}
          </h2>
          <div className="space-y-3">
            {topRisks.map((risk) => (
              <div
                key={risk.id}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  getRiskColor(risk.level)
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{risk.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {risk.description}
                    </p>
                    <p className="text-sm text-brand-600 mt-2 font-medium">
                      💡 {risk.suggestion}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-3",
                      risk.level === "high"
                        ? "bg-danger-100 text-danger-600"
                        : risk.level === "medium"
                          ? "bg-warning-100 text-warning-600"
                          : "bg-success-100 text-success-600"
                    )}
                  >
                    {risk.level === "high"
                      ? "Өндөр"
                      : risk.level === "medium"
                        ? "Дунд"
                        : "Бага"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-500" />
            {t.results.nextSteps}
          </h2>
          <div className="space-y-3">
            {nextSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {step.order}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Notes */}
        {budgetNotes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              💰 {t.results.budgetNotes}
            </h2>
            <ul className="space-y-2">
              {budgetNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-brand-500 mt-0.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expert Suggestions */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            {t.results.expertAdvice}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expertSuggestions.slice(0, 4).map((expert) => (
              <div
                key={expert.id}
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {expert.title}
                  </h3>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      expert.priority === "required"
                        ? "bg-danger-100 text-danger-600"
                        : "bg-brand-100 text-brand-600"
                    )}
                  >
                    {expert.priority === "required" ? "Заавал" : "Зөвлөмж"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{expert.reason}</p>
                <p className="text-xs text-brand-600 mt-1 font-medium">
                  ⏰ {expert.timing}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link
            href="/roadmap"
            className="flex items-center justify-between p-5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
          >
            <div>
              <div className="font-semibold">{t.results.viewRoadmap}</div>
              <div className="text-sm text-brand-200">
                Алхам алхмаар төлөвлөгөө
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/checklist"
            className="flex items-center justify-between p-5 bg-white border-2 border-brand-200 text-gray-900 rounded-xl hover:border-brand-400 transition-colors"
          >
            <div>
              <div className="font-semibold">{t.results.viewChecklist}</div>
              <div className="text-sm text-gray-500">
                Шалгах хуудас харах
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-500" />
          </Link>
        </div>

        {/* Upgrade teaser */}
        <div className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-2xl border border-brand-100 p-6 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-brand-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {t.results.paidFeature}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Бүрэн төлөвлөгөө, дэлгэрэнгүй шалгах хуудас, AI зөвлөгч, татаж
                авах боломжтой тайлан авахыг хүсвэл:
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                {t.results.upgrade}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 text-sm mb-1">
                {t.results.disclaimer}
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                {disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
