"use client";

import { useMemo, useState } from "react";
import {
  GitCompare,
  ChevronDown,
  Check,
  TrendingUp,
  Wallet,
  Clock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useProjectStore } from "@/hooks/useProject";
import { runAssessment } from "@/lib/engine";
import { buildProjectPreview, formatMnt } from "@/lib/estimate-preview";
import { cn } from "@/lib/utils";
import type { QuestionnaireInput } from "@/lib/types";
import {
  MATERIAL_OPTIONS,
  FLOOR_OPTIONS,
  BUILD_MODE_OPTIONS,
  RESIDENCE_OPTIONS,
  type FieldOption,
} from "@/lib/questionnaire-options";

// ── Харьцуулж болох хэмжээсүүд ──
type Dimension = {
  key: keyof QuestionnaireInput;
  label: string;
  options: FieldOption[];
};

const DIMENSIONS: Dimension[] = [
  {
    key: "preferredMaterial",
    label: "Материал",
    // "Шийдээгүй"-г харьцуулалтаас хасна — бодит сонголтуудыг л зэрэгцүүлнэ
    options: MATERIAL_OPTIONS.filter((o) => o.value !== "unsure"),
  },
  { key: "floors", label: "Давхар", options: FLOOR_OPTIONS },
  { key: "buildMode", label: "Удирдах арга", options: BUILD_MODE_OPTIONS },
  { key: "residenceType", label: "Зориулалт", options: RESIDENCE_OPTIONS },
];

type Row = {
  value: string;
  label: string;
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  durMin: number | null;
  durMax: number | null;
  riskCount: number;
};

function convert(key: keyof QuestionnaireInput, raw: string): unknown {
  if (key === "floors") return parseInt(raw, 10) as 1 | 2;
  return raw;
}

export default function OptionComparison() {
  const { questionnaire, setField, setAssessment } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [dimKey, setDimKey] = useState<keyof QuestionnaireInput>(
    "preferredMaterial",
  );

  const q = questionnaire;
  const dim = DIMENSIONS.find((d) => d.key === dimKey) ?? DIMENSIONS[0];

  // Сонгосон хэмжээсийн утга бүрд — бусад хариултыг хэвээр барьж тооцоолно
  const rows: Row[] = useMemo(() => {
    return dim.options.map((opt) => {
      const sQ = {
        ...q,
        [dim.key]: convert(dim.key, opt.value),
      } as Partial<QuestionnaireInput>;
      let a = null;
      try {
        a = runAssessment(sQ as QuestionnaireInput);
      } catch {
        a = null;
      }
      const preview = buildProjectPreview(sQ);
      return {
        value: opt.value,
        label: opt.label,
        score: a?.readinessScore ?? 0,
        budgetMin: preview?.budgetMin ?? null,
        budgetMax: preview?.budgetMax ?? null,
        durMin: preview?.durationMonthsMin ?? null,
        durMax: preview?.durationMonthsMax ?? null,
        riskCount: a?.topRisks.length ?? 0,
      };
    });
  }, [q, dim]);

  // Метрик бүрийн "хамгийн сайн"-г тодорхойлно (зөвхөн ялгаатай үед тэмдэглэнэ)
  const best = useMemo(() => {
    const scores = rows.map((r) => r.score);
    const budgets = rows.map((r) => r.budgetMax ?? Infinity);
    const durs = rows.map((r) => r.durMax ?? Infinity);
    const varies = (arr: number[]) =>
      Math.max(...arr) !== Math.min(...arr);
    return {
      score: varies(scores) ? Math.max(...scores) : null,
      budget: varies(budgets) ? Math.min(...budgets) : null,
      dur: varies(durs) ? Math.min(...durs) : null,
    };
  }, [rows]);

  const applyOption = (value: string) => {
    const v = convert(dim.key, value);
    const newQ = { ...q, [dim.key]: v } as Partial<QuestionnaireInput>;
    let a = null;
    try {
      a = runAssessment(newQ as QuestionnaireInput);
    } catch {
      a = null;
    }
    setField(dim.key, v as QuestionnaireInput[typeof dim.key]);
    if (a) setAssessment(a);
  };

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 sm:p-5 text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
          <GitCompare className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Сонголтуудыг зэрэгцүүлж харьцуулах
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            «Хэрэв өөр сонголт хийвэл?» — таны нөхцөлд тааруулж тооцоолно
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-4">
          {/* Dimension selector */}
          <div className="flex flex-wrap gap-1.5">
            {DIMENSIONS.map((d) => (
              <button
                key={String(d.key)}
                type="button"
                onClick={() => setDimKey(d.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  d.key === dimKey
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Доорх харьцуулалт нь зөвхөн «{dim.label}»-г өөрчилж, бусад бүх
            хариултыг тань хэвээр барьж тооцоолсон анхны баримжаа.
          </p>

          {/* Option rows */}
          <div className="space-y-2.5">
            {rows.map((r) => {
              const isCurrent = String(q[dim.key]) === r.value;
              const bestScore = best.score != null && r.score === best.score;
              const bestBudget =
                best.budget != null && (r.budgetMax ?? Infinity) === best.budget;
              const bestDur =
                best.dur != null && (r.durMax ?? Infinity) === best.dur;
              return (
                <div
                  key={r.value}
                  className={cn(
                    "rounded-xl border bg-white p-3.5",
                    isCurrent ? "border-brand-400 ring-1 ring-brand-200" : "border-gray-200",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {r.label}
                      </h3>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-medium flex-shrink-0">
                          одоогийн
                        </span>
                      )}
                    </div>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 font-medium flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Сонгосон
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => applyOption(r.value)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex-shrink-0"
                      >
                        Энийг сонгох →
                      </button>
                    )}
                  </div>

                  {/* Metrics 2×2 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Metric
                      icon={TrendingUp}
                      label="Бэлэн байдал"
                      value={String(r.score)}
                      best={bestScore}
                      bestLabel="Хамгийн бэлэн"
                    />
                    <Metric
                      icon={Wallet}
                      label="Төсөв"
                      value={
                        r.budgetMin != null && r.budgetMax != null
                          ? `${formatMnt(r.budgetMin)}–${formatMnt(r.budgetMax)}`
                          : "—"
                      }
                      best={bestBudget}
                      bestLabel="Хамгийн хямд"
                    />
                    <Metric
                      icon={Clock}
                      label="Хугацаа"
                      value={
                        r.durMin != null && r.durMax != null
                          ? `${r.durMin}–${r.durMax} сар`
                          : "—"
                      }
                      best={bestDur}
                      bestLabel="Хамгийн хурдан"
                    />
                    <Metric
                      icon={ShieldAlert}
                      label="Эрсдэл"
                      value={`${r.riskCount}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  best = false,
  bestLabel,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  best?: boolean;
  bestLabel?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-400">{label}</span>
      </div>
      <p className="text-xs font-semibold text-gray-900 leading-tight">
        {value}
      </p>
      {best && bestLabel && (
        <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full bg-success-50 text-success-600 text-[9px] font-semibold">
          <Sparkles className="w-2.5 h-2.5" />
          {bestLabel}
        </span>
      )}
    </div>
  );
}
