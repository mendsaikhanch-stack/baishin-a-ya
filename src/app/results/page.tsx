"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/hooks/useProject";
import { cn, getReadinessBgColor } from "@/lib/utils";
import { BUDGET_RANGES } from "@/lib/constants";
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
} from "lucide-react";
import { useState } from "react";

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
  const router = useRouter();
  const { assessment, questionnaire } = useProjectStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!assessment) router.push("/questionnaire");
  }, [assessment, router]);

  if (!assessment) return null;

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
  const displayRisks = topRisks.slice(0, 3);
  const displaySteps = nextSteps.slice(0, 3);
  const previewPhases = roadmapPhases.slice(0, 2);
  const lockedPhaseCount = Math.max(0, roadmapPhases.length - 2);
  const totalTasks = checklistItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
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
        <section className="rounded-2xl border-2 border-brand-200 bg-gradient-to-b from-white to-brand-50/30 overflow-hidden">
          <div className="p-5 sm:p-7">
            {/* Headline */}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              Таны нөхцөлд тохируулсан бүрэн төлөвлөгөө
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Доорх бүх зүйлийг таны оруулсан мэдээлэл дээр тулгуурлан, таны
              нөхцөлд тохируулж бэлдсэн.
            </p>

            {/* Value grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  icon: Route,
                  text: "Алхам алхмаар төлөвлөгөө",
                  sub: `${roadmapPhases.length} шат, бүх даалгавартай`,
                },
                {
                  icon: CheckSquare,
                  text: "Шат бүрийн шалгах хуудас",
                  sub: `${totalTasks} даалгавар, ахиц хянах`,
                },
                {
                  icon: MessageCircle,
                  text: "AI зөвлөгч",
                  sub: "Хязгааргүй асуулт асуух",
                },
                {
                  icon: FileDown,
                  text: "Татаж авах тайлан",
                  sub: "PDF хэлбэрээр хадгалах",
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
              Миний хувийн төлөвлөгөөг нээх — ₮29,900
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-gray-400">
              <span>Нэг төслийн үнэ</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>7 хоногийн буцаалтын баталгаа</span>
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
