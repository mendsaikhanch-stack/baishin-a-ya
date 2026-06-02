"use client";

import Link from "next/link";
import { useProjectStore } from "@/hooks/useProject";
import { cn, getReadinessBgColor } from "@/lib/utils";
import { BUDGET_RANGES } from "@/lib/constants";
import { buildProjectPreview, formatMnt } from "@/lib/estimate-preview";
import type { QuestionnaireInput, BudgetRange, RecommendedTrack } from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  CircleCheck,
  Shield,
  Lock,
  Clock,
  Users,
  ChevronDown,
  MapPin,
  Home,
  Wallet,
  Route,
  CheckSquare,
  MessageCircle,
  FileDown,
  Loader2,
  FileQuestion,
  Building2,
  Calculator,
} from "lucide-react";
import { useState } from "react";
import LivePlanEditor from "@/components/results/LivePlanEditor";
import OptionComparison from "@/components/results/OptionComparison";

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function getReadinessHeadline(score: number) {
  if (score >= 80)
    return {
      title: "Та эхлэхэд бараг бэлэн байна",
      subtitle:
        "Таны нөхцөл байдал сайн харагдаж байна. Доорх алхмуудыг хийснээр итгэлтэйгээр эхлэх боломжтой.",
    };
  if (score >= 60)
    return {
      title: "Сайн эхлэл, зарим зүйлийг шийдэх хэрэгтэй",
      subtitle:
        "Ерөнхий дүр зураг тодорхой байна. Доорх цөөн хэдэн алхмыг хийвэл илүү итгэлтэй эхлэх болно.",
    };
  if (score >= 40)
    return {
      title: "Бэлтгэл ажлаа үргэлжлүүлээрэй",
      subtitle:
        "Яарах шаардлагагүй. Доорх алхмуудыг нэг нэгээр хийж, бэлтгэлээ сайжруулаарай.",
    };
  return {
    title: "Эхний алхмуудаасаа эхэлцгээе",
    subtitle:
      "Одоогоор шийдвэрлэх зүйл нэлээд байна — гэхдээ энэ хэвийн зүйл. Доорх зөвлөмжүүд танд тусална.",
  };
}

const TRACK_LABELS: Record<RecommendedTrack, string> = {
  land_first: "Газар бэлтгэлээс эхлэх",
  finance_first: "Санхүүгийн бэлтгэлээс эхлэх",
  material_research: "Материал судлахаас эхлэх",
  planning: "Төлөвлөлтөөс эхлэх",
  execution: "Гүйцэтгэлийн шатанд шилжих",
};

function buildProfileItems(q: Partial<QuestionnaireInput>) {
  const items: { icon: React.ElementType; label: string; value: string }[] = [];

  if (q.location) {
    items.push({
      icon: MapPin,
      label: "Байршил",
      value: `${q.location}${q.urbanOrRural === "urban" ? ", хот" : q.urbanOrRural === "rural" ? ", хөдөө" : ""}`,
    });
  }
  if (q.landOwned) {
    items.push({
      icon: MapPin,
      label: "Газар",
      value: q.landOwned === "yes" ? "Газартай" : "Газаргүй",
    });
  }
  if (q.houseSize) {
    items.push({
      icon: Home,
      label: "Байшин",
      value: `${q.houseSize} м², ${q.floors === 2 ? "2 давхар" : "1 давхар"}`,
    });
  }
  if (q.budgetRange && q.budgetRange !== "unknown") {
    items.push({
      icon: Wallet,
      label: "Төсөв",
      value: BUDGET_RANGES[q.budgetRange as BudgetRange]?.label || "",
    });
  }
  if (q.familySize) {
    items.push({
      icon: Users,
      label: "Гэр бүл",
      value: `${q.familySize} хүн`,
    });
  }
  if (q.plannedStartTime && q.plannedStartTime !== "unknown") {
    const timingLabels: Record<string, string> = {
      this_spring: "Энэ хавар",
      this_summer: "Энэ зун",
      this_autumn: "Энэ намар",
      this_winter: "Энэ өвөл",
      next_year: "Ирэх жил",
    };
    items.push({
      icon: Clock,
      label: "Хугацаа",
      value: timingLabels[q.plannedStartTime] || "",
    });
  }

  return items;
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function ResultsPage() {
  const { assessment, questionnaire, hasHydrated } = useProjectStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // ── Үнэгүй PDF export — одоогийн төлөвлөгөөг тайлан болгож татна ──
  const handleDownloadPdf = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaire }),
      });
      if (!res.ok) {
        let msg = "Тайлан татаж чадсангүй. Дахин оролдоно уу.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "baishin-tolovlogoo.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading: wait for Zustand persist to rehydrate from localStorage ──
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Үр дүнг ачааллаж байна…</p>
        </div>
      </div>
    );
  }

  // ── No assessment: show explicit CTA back to questionnaire (no auto-redirect) ──
  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Тооцооны мэдээлэл олдсонгүй
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Үр дүнг харахын тулд эхлээд асуумжаа бөглөнө үү. Энэ нь 3-4 минут
            болно.
          </p>
          <Link
            href="/questionnaire"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Асуумж бөглөх
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const {
    readinessScore,
    topRisks,
    nextSteps,
    recommendedTrack,
    roadmapPhases,
    checklistItems,
    disclaimer,
  } = assessment;

  const headline = getReadinessHeadline(readinessScore);
  const profileItems = buildProfileItems(questionnaire);
  const projectPreview = buildProjectPreview(questionnaire);
  const displayRisks = topRisks.slice(0, 3);
  const displaySteps = nextSteps.slice(0, 3);
  const previewPhases = roadmapPhases.slice(0, 2);
  const lockedPhaseCount = Math.max(0, roadmapPhases.length - 2);
  const totalTasks = checklistItems.length;

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════
          SECTION 1 — Readiness summary
          ═══════════════════════════════════════ */}
      <section className="bg-white border-b">
        <div className="max-w-xl mx-auto px-4 py-10 sm:py-14 text-center">
          {/* Score ring */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-5">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60" cy="60" r="52"
                fill="none" stroke="#f3f4f6" strokeWidth="10"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none" stroke="currentColor" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(readinessScore / 100) * 326.7} 326.7`}
                className={getReadinessBgColor(readinessScore).replace("bg-", "text-")}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {readinessScore}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                оноо
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {headline.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
            {headline.subtitle}
          </p>

          {/* Recommended track chip */}
          <div className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
            <Route className="w-3.5 h-3.5" />
            Зөвлөмж: {TRACK_LABELS[recommendedTrack]}
          </div>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-7">
        {/* ═══════════════════════════════════════
            SECTION 0 — Амьд засвар (хариултаа тааруулж нөлөөг шууд хар)
            ═══════════════════════════════════════ */}
        <LivePlanEditor />

        {/* ═══════════════════════════════════════
            SECTION 0.5 — Сонголт харьцуулах (хэмжээсээр зэрэгцүүлэх)
            ═══════════════════════════════════════ */}
        <OptionComparison />

        {/* ═══════════════════════════════════════
            SECTION 1.5 — Project type + estimated budget
            (Хоёр анхны баримжаа; албан ёсны төсөв БИШ)
            ═══════════════════════════════════════ */}
        {projectPreview && (
          <section className="bg-white rounded-2xl border-2 border-brand-200 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 mb-3">
              Таны төслийн анхны баримжаа
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 leading-none mb-0.5">
                    Төслийн төрөл
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {projectPreview.projectTypeLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 leading-none mb-0.5">
                    Төсвийн муж
                  </p>
                  <p className="text-sm font-bold text-brand-700">
                    {formatMnt(projectPreview.budgetMin)} –{" "}
                    {formatMnt(projectPreview.budgetMax)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Энэ нь зөвхөн анхны баримжаа бөгөөд албан ёсны инженерийн төсөв
                биш. Эцсийн дүнг мэргэжлийн төсөвчин, архитектортой нягтлаарай.
              </p>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════
            SECTION 2 — User profile mirror
            ═══════════════════════════════════════ */}
        {profileItems.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Таны мэдээлэл
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {profileItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 min-w-0">
                  <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 leading-none">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════
            SECTION 3 — Top 3 risks
            ═══════════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Анхаарах зүйлс
          </h2>

          <div className="space-y-2.5">
            {displayRisks.map((risk, i) => (
              <div
                key={risk.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-4 pb-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5",
                      risk.level === "high"
                        ? "bg-red-100 text-red-600"
                        : risk.level === "medium"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-green-100 text-green-600"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">
                      {risk.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {risk.description}
                    </p>
                  </div>
                </div>
                <div className="bg-brand-50/60 px-4 py-2 border-t border-brand-100/60">
                  <p className="text-xs text-brand-700 leading-relaxed">
                    <span className="font-semibold">Зөвлөгөө:</span>{" "}
                    {risk.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 4 — Top 3 next steps
            ═══════════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-brand-600" />
            Одоо юу хийх вэ?
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {displaySteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3.5 p-4">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {step.order}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 5 — Roadmap preview (locked)
            ═══════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Таны төлөвлөгөө
            </h2>
            <span className="text-[11px] text-gray-400">
              {roadmapPhases.length} шат · {totalTasks} даалгавар
            </span>
          </div>

          {/* Visible first 2 phases */}
          <div className="space-y-2.5">
            {previewPhases.map((phase) => (
              <div
                key={phase.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                    phase.status === "active"
                      ? "bg-brand-100 text-brand-700"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {phase.phase}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-900">
                      {phase.title}
                    </h3>
                    {phase.expertNeeded && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                        <Users className="w-2.5 h-2.5" />
                        Мэргэжилтэн
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {phase.description}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {phase.estimatedDuration} · {phase.tasks.length} даалгавар
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Locked remaining phases */}
          {lockedPhaseCount > 0 && (
            <div className="mt-2.5 relative">
              {/* Blurred fake row */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 opacity-40 blur-[2px] select-none pointer-events-none" aria-hidden>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                  <div className="h-2 bg-gray-100 rounded w-1/3" />
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-xl">
                <Lock className="w-5 h-5 text-gray-400 mb-1.5" />
                <p className="text-sm font-medium text-gray-600">
                  + {lockedPhaseCount} шат түгжээтэй
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Бүрэн төлөвлөгөө авахын тулд сайжруулна уу
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════
            SECTION 6 — Paid unlock block
            ═══════════════════════════════════════ */}
        {/* ── Үнэгүй: бүрэн төлөвлөгөө + PDF татах ── */}
        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-4">
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-success-50 text-success-600 text-[11px] font-semibold">
                Үнэгүй
              </span>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Бүрэн төлөвлөгөө + татах
              </h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {roadmapPhases.length} шаттай roadmap, {totalTasks} даалгаврын
              checklist бүгд нээлттэй. Одоогийн төлөвлөгөөгөө PDF болгож үнэгүй
              татаарай — хариултаа өөрчлөх бүрд шинэ, тухайн агшинд тохирсон
              тайлан гаргаж болно.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
              <Link
                href="/roadmap"
                className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-100 p-3 hover:border-gray-300 transition-colors"
              >
                <Route className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">
                  Бүрэн roadmap
                </span>
              </Link>
              <Link
                href="/checklist"
                className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-100 p-3 hover:border-gray-300 transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">
                  Шалгах хуудас
                </span>
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-100 p-3 hover:border-gray-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">
                  AI чат
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3.5 font-semibold rounded-xl transition-colors",
                downloading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20",
              )}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Тайлан бэлдэж байна…
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Төлөвлөгөөгөө PDF-ээр татах
                </>
              )}
            </button>
            {downloadError && (
              <p className="text-xs text-red-600 text-center mt-2">
                {downloadError}
              </p>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 6 — Амьд AI зөвлөгч (subscription)
            ═══════════════════════════════════════ */}
        <section className="rounded-2xl border-2 border-brand-200 bg-gradient-to-b from-white to-brand-50/30 overflow-hidden">
          <div className="p-5 sm:p-7">
            {/* Headline */}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              Төсөл өөрчлөгдөх бүрд тааруулсан амьд зөвлөгч
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Барилга бол олон сарын аялал — газар, материал, төсөв чинь замдаа
              өөрчлөгдөнө. Өөрчлөлт болгонд тань тохирсон зөвлөгөөг AI зөвлөгч
              өгч, сонголтуудыг харьцуулж шийдэхэд тусална.
            </p>

            {/* Value grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  icon: MessageCircle,
                  text: "Өөрчлөлт болгонд тааруулсан зөвлөгөө",
                  sub: "Газар, материал, төсөв өөрчлөгдөхөд шинэчилнэ",
                },
                {
                  icon: Calculator,
                  text: "Сонголтуудыг харьцуулах",
                  sub: "Хувилбар бүрийн үр дагаврыг тооцно",
                },
                {
                  icon: Route,
                  text: "Хязгааргүй AI асуулт",
                  sub: "Таны бүх мэдээллийг мэдсэн зөвлөгч",
                },
                {
                  icon: Users,
                  text: "Төсөл дуустал хамт",
                  sub: "Сар бүрийн тогтмол хандалт",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-2.5 bg-white rounded-lg border border-gray-100 p-3"
                >
                  <div className="w-7 h-7 rounded-md bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {item.text}
                    </p>
                    <p className="text-[11px] text-gray-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm shadow-brand-600/20"
            >
              Амьд AI зөвлөгч идэвхжүүлэх
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-gray-400">
              <span>Сар бүрийн төлбөр</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Хүссэн үедээ цуцлах</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 7 — Mini FAQ
            ═══════════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Түгээмэл асуултууд
          </h2>
          <div className="space-y-2">
            {[
              {
                q: "Энэ төлөвлөгөө архитекторыг орлох уу?",
                a: "Үгүй. Энэ нь таны бэлтгэлийг зохион байгуулах зориулалттай бөгөөд мэргэжлийн зураг төсөл, инженерийн тооцоог орлохгүй. Хэзээ мэргэжилтэнтэй холбогдох хэрэгтэйг бид тодорхой зааж өгнө.",
              },
              {
                q: "Төлбөр төлсний дараа яг юу авах вэ?",
                a: "Таны нөхцөлд тохируулсан бүрэн алхам алхмаар төлөвлөгөө, шат бүрийн шалгах хуудас, AI зөвлөгч, татаж авах тайлан, мэргэжилтний зөвлөмж бүгдийг нэг дороос аваарай.",
              },
              {
                q: "Сэтгэл ханамжгүй бол яах вэ?",
                a: "7 хоногийн дотор мөнгөө бүрэн буцааж авах боломжтой. Ямар нэг нэмэлт нөхцөлгүй.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-gray-800 pr-3">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform",
                      openFaq === i && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    openFaq === i ? "max-h-40 pb-4" : "max-h-0"
                  )}
                >
                  <p className="px-4 text-xs text-gray-500 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            Disclaimer
            ═══════════════════════════════════════ */}
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-700/80 leading-relaxed">
            {disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
