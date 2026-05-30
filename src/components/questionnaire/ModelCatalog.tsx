"use client";

import { useMemo, useState } from "react";
import { Check, HelpCircle, Layers, Hammer, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreferredMaterial } from "@/lib/types";
import {
  HOUSE_MODELS,
  UNDECIDED_MODEL_ID,
  TIER_LABELS,
  MODEL_MATERIAL_LABELS,
  modelBudgetRange,
  type HouseModel,
  type ModelTier,
} from "@/lib/house-models";

// ── Accent өнгөний классууд ──
const ACCENT: Record<
  HouseModel["accent"],
  { bg: string; text: string; ring: string }
> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-200",
  },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    ring: "ring-violet-200",
  },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-200" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-200" },
};

function fmtMnt(v: number): string {
  return `${Math.round(v / 1_000_000)} сая`;
}

// ── Filter тодорхойлолт ──
type FloorFilter = "all" | "1" | "2";
type MaterialFilter = "all" | PreferredMaterial;
type TierFilter = "all" | ModelTier;

const FLOOR_OPTS: { value: FloorFilter; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "1", label: "1 давхар" },
  { value: "2", label: "2 давхар" },
];

const MATERIAL_OPTS: { value: MaterialFilter; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "brick", label: "Тоосго" },
  { value: "block", label: "Блок" },
  { value: "frame", label: "Каркас" },
  { value: "sip", label: "SIP" },
];

const TIER_OPTS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "economy", label: "Эдийн засгийн" },
  { value: "mid", label: "Дунд" },
  { value: "premium", label: "Премиум" },
];

function FilterRow<T extends string>({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: typeof Layers;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <span className="text-[11px] text-gray-400 w-12 flex-shrink-0">
        {label}
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
              value === o.value
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ModelCatalog({
  selectedId,
  onSelect,
}: {
  selectedId: string | undefined;
  /** Загвар сонгоход дуудна. undecided бол null. */
  onSelect: (model: HouseModel | null) => void;
}) {
  const [floor, setFloor] = useState<FloorFilter>("all");
  const [material, setMaterial] = useState<MaterialFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return HOUSE_MODELS.filter((m) => {
      if (floor !== "all" && String(m.floors) !== floor) return false;
      if (material !== "all" && m.material !== material) return false;
      if (tier !== "all" && m.tier !== tier) return false;
      return true;
    });
  }, [floor, material, tier]);

  const hasFilters = floor !== "all" || material !== "all" || tier !== "all";

  return (
    <div>
      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2.5">
        <FilterRow
          icon={Layers}
          label="Давхар"
          options={FLOOR_OPTS}
          value={floor}
          onChange={setFloor}
        />
        <FilterRow
          icon={Hammer}
          label="Материал"
          options={MATERIAL_OPTS}
          value={material}
          onChange={setMaterial}
        />
        <FilterRow
          icon={Wallet}
          label="Төсөв"
          options={TIER_OPTS}
          value={tier}
          onChange={setTier}
        />
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400">
            {filtered.length} загвар олдлоо
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setFloor("all");
                setMaterial("all");
                setTier("all");
              }}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              Цэвэрлэх
            </button>
          )}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="mt-3 space-y-3">
        {filtered.map((m) => {
          const sel = selectedId === m.id;
          const accent = ACCENT[m.accent];
          const budget = modelBudgetRange(m);
          const isOpen = expanded === m.id;
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-2xl border-2 bg-white transition-all overflow-hidden",
                sel
                  ? "border-brand-500 ring-1 ring-brand-200"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full text-left p-4 flex gap-3"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    accent.bg
                  )}
                >
                  <m.icon className={cn("w-6 h-6", accent.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {m.name}
                    </h3>
                    {sel && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                    {m.tagline}
                  </p>
                  {/* meta badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        accent.bg,
                        accent.text
                      )}
                    >
                      {m.archetype}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      {m.floors} давхар
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      {MODEL_MATERIAL_LABELS[m.material]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      {TIER_LABELS[m.tier]}
                    </span>
                  </div>
                  {/* size + budget */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                    <span>
                      {m.sizeMin}–{m.sizeMax} м²
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="font-medium text-gray-700">
                      ≈ {fmtMnt(budget.min)}–{fmtMnt(budget.max)} ₮
                    </span>
                  </div>
                </div>
              </button>

              {/* expand toggle */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : m.id)}
                className="w-full px-4 pb-3 -mt-1 text-[11px] text-brand-600 font-medium text-left"
              >
                {isOpen ? "Хураах ▲" : "Дэлгэрэнгүй ▼"}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 space-y-2 border-t border-gray-100">
                  <ul className="mt-3 space-y-1">
                    {m.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-gray-600"
                      >
                        <Check
                          className={cn(
                            "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                            accent.text
                          )}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium text-gray-800">
                      Хэнд тохирох:{" "}
                    </span>
                    {m.bestFor}
                  </p>
                  <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <span className="text-amber-600 text-xs flex-shrink-0">
                      ⚠
                    </span>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      {m.watchOut}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            Энэ шүүлтүүрт тохирох загвар алга. Шүүлтүүрээ өөрчилнө үү.
          </div>
        )}
      </div>

      {/* ── Undecided card ── */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "w-full mt-3 rounded-2xl border-2 border-dashed p-4 flex items-center gap-3 text-left transition-all",
          selectedId === UNDECIDED_MODEL_ID
            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
            : "border-gray-300 hover:border-gray-400 bg-white"
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-6 h-6 text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            Хараахан тодорхойгүй
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Загвараа дараа шийднэ — бид дараагийн алхмуудад тань туслана
          </p>
        </div>
        {selectedId === UNDECIDED_MODEL_ID && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
      </button>
    </div>
  );
}
