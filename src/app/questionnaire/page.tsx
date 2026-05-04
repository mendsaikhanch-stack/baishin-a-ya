"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/hooks/useProject";
import { runAssessment } from "@/lib/engine";
import type { QuestionnaireInput } from "@/lib/types";
import { PROVINCES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
  Wallet,
  ClipboardList,
  Shield,
  Loader2,
  Building2,
  Mountain,
  PlugZap,
  Sun,
} from "lucide-react";
import InfoCard from "@/components/questionnaire/InfoCard";

// ────────────────────────────────────────────
// Per-step educational content (info-first UX)
// ────────────────────────────────────────────

const LAND_INFO_SECTIONS = [
  {
    icon: Building2,
    title: "Байршил — нуугдмал зардлын эх үүсвэр",
    body:
      "Хотын төв: м² 1-5 сая ₮, дэд бүтэц бэлэн. Захын дүүрэг (Яармаг, Зайсан, Сонгино): дунд үнэ, дэд бүтэц хэсэгчилсэн, ирээдүйн өсөлт сайн. Хөдөө: газар хямд боловч цахилгаан/ус татахад 5-30 сая ₮ нэмэлт орох тул нийт төсөв бараг хямдрахгүй байж мэднэ.",
  },
  {
    icon: Mountain,
    title: "Хөрс ба налуу — суурийн зардлыг 2-3 дахин өөрчилнө",
    body:
      "Тэгш хатуу хөрс: стандарт суурь, хамгийн хямд. Налуу газар: тулах хана, дэвссэн суурь — 30-50% нэмэгдэл. Намаг/зөөлөн хөрс: pile foundation шаардана — 2-3 дахин үнэтэй. Газар сонгохын өмнө хөрсний шинжилгээ заавал хийлгээрэй (200-500 мянга ₮).",
  },
  {
    icon: PlugZap,
    title: "Дэд бүтцийн холболт — ихэнх хүн мартдаг зардал",
    body:
      "Цахилгаан: 100м хүртэл 1-3 сая ₮, цааш ~30,000 ₮/м. Ус: гүн өрмийн худаг 3-8 сая, төв шугамд холбох 5-15 сая ₮. Бохир: септик 2-4 сая, төв шугам 3-10 сая ₮. Зам засмал эсэх нь өвлийн хүртээмжид шууд нөлөөлнө.",
  },
  {
    icon: Sun,
    title: "Байгалийн шалгуур",
    body:
      "Өмнөд талаа задгай газар сонгоорой (нар, нарны самбарын үр ашиг). Давамгайлах салхины эсрэг хаалт төлөвлө. Гол горхи, нам дор газраас зайлсхий — үерийн эрсдэлтэй. Ойр өндөр барилга, уул нар хаах эсэхийг шалга.",
  },
];

// ────────────────────────────────────────────
// Step metadata
// ────────────────────────────────────────────

const STEP_META = [
  {
    id: 1,
    icon: MapPin,
    title: "Газрын мэдээлэл",
    subtitle: "Газартай эсэх, байршил, нөхцөлийн тухай",
  },
  {
    id: 2,
    icon: Home,
    title: "Байшингийн мэдээлэл",
    subtitle: "Хэмжээ, давхар, материал, зориулалт",
  },
  {
    id: 3,
    icon: Wallet,
    title: "Төсөв ба хугацаа",
    subtitle: "Санхүү, зээл, эхлэх хугацаа",
  },
  {
    id: 4,
    icon: ClipboardList,
    title: "Таны бэлэн байдал",
    subtitle: "Одоогийн шат, барилгын арга",
  },
] as const;

// ────────────────────────────────────────────
// Reusable field components
// ────────────────────────────────────────────

function FieldLabel({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
      )}
    </div>
  );
}

function RadioField({
  label,
  hint,
  options,
  value,
  onChange,
  columns = 1,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string; sub?: string }[];
  value: string | number | undefined;
  onChange: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <fieldset>
      <FieldLabel label={label} hint={hint} />
      <div
        className={cn(
          "grid gap-2",
          columns === 2 ? "grid-cols-2" : "grid-cols-1"
        )}
      >
        {options.map((opt) => {
          const selected =
            String(value) === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "text-left px-4 py-3 rounded-xl border-2 transition-all text-sm",
                selected
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <span className="font-medium text-gray-900">{opt.label}</span>
              {opt.sub && (
                <span className="block text-xs text-gray-400 mt-0.5">
                  {opt.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function SelectField({
  label,
  hint,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <FieldLabel label={label} hint={hint} />
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

function NumberField({
  label,
  hint,
  placeholder,
  suffix,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  suffix?: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <fieldset>
      <FieldLabel label={label} hint={hint} />
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </fieldset>
  );
}

// ────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────

export default function QuestionnairePage() {
  const router = useRouter();
  const { questionnaire, setField, currentStep, setStep, setAssessment } =
    useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const q = questionnaire;
  const step = currentStep; // 0-3
  const meta = STEP_META[step];
  const totalSteps = STEP_META.length;
  const isLast = step === totalSteps - 1;

  const set = (key: keyof QuestionnaireInput, value: unknown) =>
    setField(key, value as QuestionnaireInput[typeof key]);

  // ── Validation per step ──
  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!(q.landOwned && q.location && q.urbanOrRural && q.landSlope);
      case 1:
        return !!(
          q.houseSize &&
          q.houseSize > 0 &&
          q.floors &&
          q.preferredMaterial &&
          q.familySize &&
          q.familySize > 0 &&
          q.residenceType
        );
      case 2:
        return !!(q.budgetRange && q.loanStatus && q.plannedStartTime);
      case 3:
        return !!(q.currentStage && q.buildMode);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isLast) {
      handleSubmit();
    } else {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      const result = runAssessment(q as QuestionnaireInput);
      setAssessment(result);
      router.push("/results");
    } catch {
      setIsSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ── Progress bar ── */}
      <div className="sticky top-16 z-10 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Step dots */}
          <div className="flex items-center justify-between mb-2">
            {STEP_META.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        done
                          ? "bg-brand-600 text-white"
                          : active
                            ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500"
                            : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {done ? "✓" : s.id}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1 hidden sm:block",
                        active ? "text-brand-700 font-medium" : "text-gray-400"
                      )}
                    >
                      {s.title.split(" ")[0]}
                    </span>
                  </div>
                  {i < STEP_META.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-8 sm:w-14 mx-1",
                        i < step ? "bg-brand-500" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Step content ── */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
            <meta.icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{meta.title}</h1>
            <p className="text-xs text-gray-400">{meta.subtitle}</p>
          </div>
        </div>

        {/* Step 1 (land) info card — info-first pattern */}
        {step === 0 && (
          <div className="mt-4">
            <InfoCard
              title="Газар сонгохдоо юуг анхаарах вэ?"
              intro="Газрын сонголт нийт төсвийн 20-40%-ийг шууд тодорхойлно. Доорх 4 зүйлийг ойлгосны дараа асуултанд хариулбал илүү зөв шийдвэр гарна."
              sections={LAND_INFO_SECTIONS}
            />
          </div>
        )}

        {/* Fields card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mt-4 space-y-5">
          {/* ── Step 1: Газрын мэдээлэл ── */}
          {step === 0 && (
            <>
              <RadioField
                label="Та газартай юу?"
                options={[
                  { value: "yes", label: "Тийм, газартай" },
                  { value: "no", label: "Үгүй, одоогоор газаргүй" },
                ]}
                value={q.landOwned}
                onChange={(v) => set("landOwned", v)}
                columns={2}
              />

              <SelectField
                label="Хаана барих вэ?"
                hint="Одоогоор тодорхойгүй бол хамгийн ойрхон сонголтоо сонгоорой."
                placeholder="Аймаг / хот сонгоно уу"
                options={PROVINCES.map((p) => ({ value: p, label: p }))}
                value={q.location}
                onChange={(v) => set("location", v)}
              />

              <RadioField
                label="Хот уу, хөдөө юу?"
                options={[
                  { value: "urban", label: "Хот, суурин газар" },
                  { value: "rural", label: "Хөдөө, орон нутаг" },
                ]}
                value={q.urbanOrRural}
                onChange={(v) => set("urbanOrRural", v)}
                columns={2}
              />

              <RadioField
                label="Газрын гадаргуу ямар вэ?"
                hint="Хараахан мэдэхгүй бол 'Мэдэхгүй' гэж сонгож болно."
                options={[
                  { value: "flat", label: "Тэгш" },
                  { value: "slight", label: "Бага налуу" },
                  { value: "steep", label: "Их налуу" },
                  { value: "unknown", label: "Мэдэхгүй" },
                ]}
                value={q.landSlope}
                onChange={(v) => set("landSlope", v)}
                columns={2}
              />
            </>
          )}

          {/* ── Step 2: Байшингийн мэдээлэл ── */}
          {step === 1 && (
            <>
              <NumberField
                label="Байшингийн нийт талбай"
                hint="Дундаж гэр бүлд 80–150 м² хангалттай."
                placeholder="жишээ: 120"
                suffix="м²"
                value={q.houseSize}
                onChange={(v) => set("houseSize", v)}
              />

              <RadioField
                label="Хэдэн давхар?"
                options={[
                  { value: "1", label: "1 давхар" },
                  { value: "2", label: "2 давхар" },
                ]}
                value={q.floors}
                onChange={(v) => set("floors", parseInt(v) as 1 | 2)}
                columns={2}
              />

              <RadioField
                label="Ямар материалаар барих вэ?"
                hint="Шийдээгүй бол 'Одоогоор шийдээгүй' сонгоорой — бид зөвлөнө."
                options={[
                  { value: "brick", label: "Тоосго" },
                  { value: "block", label: "Блок" },
                  { value: "frame", label: "Каркас (мод)" },
                  { value: "sip", label: "SIP панел" },
                  { value: "unsure", label: "Одоогоор шийдээгүй" },
                ]}
                value={q.preferredMaterial}
                onChange={(v) => set("preferredMaterial", v)}
                columns={2}
              />

              <NumberField
                label="Гэр бүлийн хэдэн гишүүн амьдрах вэ?"
                placeholder="жишээ: 4"
                suffix="хүн"
                value={q.familySize}
                onChange={(v) => set("familySize", v)}
              />

              <RadioField
                label="Зориулалт"
                options={[
                  { value: "primary", label: "Байнга амьдрах байшин" },
                  { value: "vacation", label: "Зуслан / амралтын байшин" },
                ]}
                value={q.residenceType}
                onChange={(v) => set("residenceType", v)}
                columns={2}
              />
            </>
          )}

          {/* ── Step 3: Төсөв ба хугацаа ── */}
          {step === 2 && (
            <>
              <RadioField
                label="Нийт төсвийн хэмжээ"
                hint="Газар, барилга, засал бүгдийг оролцуулсан нийт дүн. Тодорхойгүй бол тэр сонголтыг сонгоорой."
                options={[
                  { value: "under_50m", label: "50 сая ₮-с доош" },
                  { value: "50m_80m", label: "50–80 сая ₮" },
                  { value: "80m_120m", label: "80–120 сая ₮" },
                  { value: "120m_180m", label: "120–180 сая ₮" },
                  { value: "180m_250m", label: "180–250 сая ₮" },
                  { value: "over_250m", label: "250 сая ₮-с дээш" },
                  { value: "unknown", label: "Тодорхойгүй" },
                ]}
                value={q.budgetRange}
                onChange={(v) => set("budgetRange", v)}
              />

              <RadioField
                label="Зээл авах уу?"
                options={[
                  { value: "no", label: "Үгүй, өөрийн хөрөнгөөр" },
                  { value: "yes", label: "Тийм, зээл авна" },
                  { value: "maybe", label: "Магадгүй, хараахан шийдээгүй" },
                ]}
                value={q.loanStatus}
                onChange={(v) => set("loanStatus", v)}
              />

              <RadioField
                label="Хэзээ эхлэхээр төлөвлөж байна?"
                hint="Ойролцоо сонголт хийвэл хангалттай."
                options={[
                  { value: "this_spring", label: "Энэ хавар" },
                  { value: "this_summer", label: "Энэ зун" },
                  { value: "this_autumn", label: "Энэ намар" },
                  { value: "this_winter", label: "Энэ өвөл" },
                  { value: "next_year", label: "Ирэх жил" },
                  { value: "unknown", label: "Тодорхойгүй" },
                ]}
                value={q.plannedStartTime}
                onChange={(v) => set("plannedStartTime", v)}
                columns={2}
              />
            </>
          )}

          {/* ── Step 4: Бэлэн байдал ── */}
          {step === 3 && (
            <>
              <RadioField
                label="Одоо ямар шатанд байна?"
                hint="Хамгийн ойр тохирох сонголтоо сонгоорой."
                options={[
                  {
                    value: "thinking",
                    label: "Зүгээр л бодож байна",
                    sub: "Хараахан тодорхой төлөвлөгөөгүй",
                  },
                  {
                    value: "planning",
                    label: "Төлөвлөж эхэлсэн",
                    sub: "Мэдээлэл цуглуулж, судалж байна",
                  },
                  {
                    value: "land_selection",
                    label: "Газар хайж байна",
                    sub: "Газрын сонголт дээр ажиллаж байна",
                  },
                  {
                    value: "design",
                    label: "Зураг төсөл хийж байна",
                    sub: "Архитектортой хамтран ажиллаж байна",
                  },
                  {
                    value: "budgeting",
                    label: "Төсөв бэлдэж байна",
                    sub: "Зардлаа тооцоолж, эх үүсвэр хайж байна",
                  },
                  {
                    value: "ready",
                    label: "Эхлэхэд бэлэн",
                    sub: "Газар, зураг, төсөв бүгд бэлэн",
                  },
                ]}
                value={q.currentStage}
                onChange={(v) => set("currentStage", v)}
              />

              <RadioField
                label="Барилгаа хэрхэн удирдах вэ?"
                options={[
                  {
                    value: "hire",
                    label: "Баг / компани хөлслөнө",
                    sub: "Мэргэжлийн хүмүүс бүгдийг хийнэ",
                  },
                  {
                    value: "mixed",
                    label: "Хосолсон",
                    sub: "Зарим ажлыг өөрөө, зарим ажлыг хөлслөнө",
                  },
                  {
                    value: "self",
                    label: "Өөрөө удирдана",
                    sub: "Ажилчдыг өөрөө хайж, удирдана",
                  },
                ]}
                value={q.buildMode}
                onChange={(v) => set("buildMode", v)}
              />

              <div className="mt-2">
                <FieldLabel
                  label="Ажил эхлүүлсэн бол одоогийн төлөвөө товч бичнэ үү (заавал биш)"
                  hint="Жишээ: «Суурь цутгасан, хана 60% өрсөн, дээвэргүй» эсвэл «Зөвхөн фундамент цутгасан»"
                />
                <textarea
                  rows={3}
                  maxLength={500}
                  value={q.currentStageDescription ?? ""}
                  onChange={(e) =>
                    set("currentStageDescription", e.target.value)
                  }
                  placeholder="Жишээ нь: Суурь, хана дууссан, дээвэр карказтай"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                  {(q.currentStageDescription ?? "").length} / 500
                </p>
              </div>

              {/* Final disclaimer before submit */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Энэ мэдээлэл дээр үндэслэн бид таны бэлэн байдлын оноо,
                  эрсдэл, дараагийн алхмуудыг тодорхойлно. Энэ нь зөвхөн
                  чиглүүлэг бөгөөд мэргэжлийн зөвлөгөөг орлохгүй.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Fixed bottom navigation ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className={cn(
              "flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              step === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Өмнөх
          </button>

          <span className="text-xs text-gray-400">
            {step + 1} / {totalSteps}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={cn(
              "flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              canProceed() && !isSubmitting
                ? "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Боловсруулж байна
              </>
            ) : isLast ? (
              "Дүн гаргах"
            ) : (
              <>
                Үргэлжлүүлэх
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
