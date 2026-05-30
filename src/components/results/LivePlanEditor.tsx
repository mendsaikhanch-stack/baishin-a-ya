"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  ShieldAlert,
  Pencil,
} from "lucide-react";
import { useProjectStore } from "@/hooks/useProject";
import { runAssessment } from "@/lib/engine";
import { buildProjectPreview, formatMnt } from "@/lib/estimate-preview";
import { cn } from "@/lib/utils";
import type { QuestionnaireInput } from "@/lib/types";
import {
  MATERIAL_OPTIONS,
  FLOOR_OPTIONS,
  RESIDENCE_OPTIONS,
  BUDGET_OPTIONS,
  URBAN_RURAL_OPTIONS,
  SLOPE_OPTIONS,
  BUILD_MODE_OPTIONS,
  type FieldOption,
} from "@/lib/questionnaire-options";

// ── Тухайн агшны үзүүлэлтийн зураглал ──
type Snap = {
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  riskCount: number;
  track: string;
};

function snap(
  q: Partial<QuestionnaireInput>,
  a: ReturnType<typeof runAssessment> | null,
): Snap {
  const preview = buildProjectPreview(q);
  return {
    score: a?.readinessScore ?? 0,
    budgetMin: preview?.budgetMin ?? null,
    budgetMax: preview?.budgetMax ?? null,
    riskCount: a?.topRisks.length ?? 0,
    track: a?.recommendedTrack ?? "",
  };
}

type Impact = { before: Snap; after: Snap; fieldLabel: string } | null;

// ── Компакт сонголтын мөр ──
function PillRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FieldOption[];
  value: string | number | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-700 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = String(value) === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selected
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Дельта чип (өсөлт/бууралт) ──
function Delta({
  diff,
  goodWhenUp = true,
  suffix = "",
}: {
  diff: number;
  goodWhenUp?: boolean;
  suffix?: string;
}) {
  if (diff === 0)
    return <span className="text-[11px] text-gray-400">өөрчлөлтгүй</span>;
  const up = diff > 0;
  const good = goodWhenUp ? up : !up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
        good ? "text-success-600" : "text-amber-600",
      )}
    >
      <Icon className="w-3 h-3" />
      {up ? "+" : ""}
      {diff}
      {suffix}
    </span>
  );
}

export default function LivePlanEditor() {
  const { questionnaire, assessment, setField, setAssessment } =
    useProjectStore();
  const [open, setOpen] = useState(false);
  const [impact, setImpact] = useState<Impact>(null);

  const q = questionnaire;
  const live = snap(q, assessment);

  // Утгыг тааруулж store-руу бичээд, assessment-ыг дахин тооцоолно
  const applyChange = (
    key: keyof QuestionnaireInput,
    rawValue: string,
    fieldLabel: string,
  ) => {
    // Талбарын төрлөөр хөрвүүлэх
    const value: unknown =
      key === "floors"
        ? (parseInt(rawValue, 10) as 1 | 2)
        : key === "houseSize"
          ? parseInt(rawValue, 10) || 0
          : rawValue;

    const newQ = {
      ...q,
      [key]: value,
    } as Partial<QuestionnaireInput>;

    let newA = assessment;
    try {
      newA = runAssessment(newQ as QuestionnaireInput);
    } catch {
      // Тооцоолол бүтэхгүй бол хуучин дүнг хадгална
      newA = assessment;
    }

    const before = snap(q, assessment);
    const after = snap(newQ, newA);

    setField(key, value as QuestionnaireInput[typeof key]);
    if (newA) setAssessment(newA);
    setImpact({ before, after, fieldLabel });
  };

  const budgetLabel =
    live.budgetMin != null && live.budgetMax != null
      ? `${formatMnt(live.budgetMin)}–${formatMnt(live.budgetMax)}`
      : "—";

  const scoreDiff = impact ? impact.after.score - impact.before.score : 0;
  const riskDiff = impact ? impact.after.riskCount - impact.before.riskCount : 0;
  const budgetDiff =
    impact && impact.after.budgetMax != null && impact.before.budgetMax != null
      ? Math.round(
          (impact.after.budgetMin! +
            impact.after.budgetMax -
            (impact.before.budgetMin! + impact.before.budgetMax)) /
            2 /
            1_000_000,
        )
      : 0;
  const trackChanged = impact ? impact.after.track !== impact.before.track : false;

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/40 overflow-hidden">
      {/* Header — live metrics strip, always reflects current state */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 sm:p-5 text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Тохиргоогоо тааруулж, нөлөөг шууд хар
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-brand-500" />
              Бэлэн байдал {live.score}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="w-3 h-3 text-brand-500" />
              {budgetLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-brand-500" />
              {live.riskCount} эрсдэл
            </span>
          </div>
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
          {/* Impact banner — сүүлийн өөрчлөлтийн нөлөө */}
          {impact && (
            <div className="rounded-xl bg-white border border-gray-200 p-3">
              <p className="text-[11px] text-gray-400 mb-1.5">
                «{impact.fieldLabel}» өөрчлөлтийн нөлөө:
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                  Бэлэн байдал {impact.after.score}
                  <Delta diff={scoreDiff} goodWhenUp />
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                  Төсөв
                  <Delta diff={budgetDiff} goodWhenUp={false} suffix=" сая" />
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                  Эрсдэл {impact.after.riskCount}
                  <Delta diff={riskDiff} goodWhenUp={false} />
                </span>
                {trackChanged && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600">
                    <Pencil className="w-3 h-3" />
                    Зөвлөмж шинэчлэгдсэн
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Editable high-impact fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PillRow
              label="Материал"
              options={MATERIAL_OPTIONS}
              value={q.preferredMaterial}
              onChange={(v) => applyChange("preferredMaterial", v, "Материал")}
            />
            <PillRow
              label="Давхар"
              options={FLOOR_OPTIONS}
              value={q.floors}
              onChange={(v) => applyChange("floors", v, "Давхар")}
            />
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1.5">
                Талбай (м²)
              </p>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={q.houseSize || ""}
                onChange={(e) => applyChange("houseSize", e.target.value, "Талбай")}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none"
              />
            </div>
            <PillRow
              label="Зориулалт"
              options={RESIDENCE_OPTIONS}
              value={q.residenceType}
              onChange={(v) => applyChange("residenceType", v, "Зориулалт")}
            />
            <PillRow
              label="Нийт төсөв"
              options={BUDGET_OPTIONS}
              value={q.budgetRange}
              onChange={(v) => applyChange("budgetRange", v, "Төсөв")}
            />
            <PillRow
              label="Хот / Хөдөө"
              options={URBAN_RURAL_OPTIONS}
              value={q.urbanOrRural}
              onChange={(v) => applyChange("urbanOrRural", v, "Байршил")}
            />
            <PillRow
              label="Газрын гадаргуу"
              options={SLOPE_OPTIONS}
              value={q.landSlope}
              onChange={(v) => applyChange("landSlope", v, "Газрын гадаргуу")}
            />
            <PillRow
              label="Удирдах арга"
              options={BUILD_MODE_OPTIONS}
              value={q.buildMode}
              onChange={(v) => applyChange("buildMode", v, "Удирдах арга")}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-400">
              Өөрчлөлт шууд хадгалагдаж, доорх төлөвлөгөө шинэчлэгдэнэ.
            </p>
            <Link
              href="/questionnaire"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700"
            >
              <Pencil className="w-3 h-3" />
              Бүх асуултыг засах
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
