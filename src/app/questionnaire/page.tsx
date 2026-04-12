"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/hooks/useProject";
import { runAssessment } from "@/lib/engine";
import type { QuestionnaireInput } from "@/lib/types";
import { PROVINCES, DISCLAIMER_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Layers,
  Users,
  Hammer,
  Target,
} from "lucide-react";

type StepConfig = {
  key: keyof QuestionnaireInput;
  icon: React.ReactNode;
  label: string;
  type: "radio" | "select" | "number";
  options?: { value: string; label: string; description?: string }[];
  placeholder?: string;
  hint?: string;
};

const STEPS: StepConfig[] = [
  {
    key: "landOwned",
    icon: <MapPin className="w-5 h-5" />,
    label: "Та газартай юу?",
    type: "radio",
    options: [
      { value: "yes", label: "Тийм, газартай" },
      { value: "no", label: "Үгүй, газаргүй" },
    ],
  },
  {
    key: "location",
    icon: <MapPin className="w-5 h-5" />,
    label: "Хаана барих вэ?",
    type: "select",
    options: PROVINCES.map((p) => ({ value: p, label: p })),
    placeholder: "Аймаг/хот сонгоно уу",
  },
  {
    key: "urbanOrRural",
    icon: <Home className="w-5 h-5" />,
    label: "Хот, хөдөө аль нь вэ?",
    type: "radio",
    options: [
      { value: "urban", label: "Хот, суурин газар" },
      { value: "rural", label: "Хөдөө" },
    ],
  },
  {
    key: "landSlope",
    icon: <Layers className="w-5 h-5" />,
    label: "Газрын нөхцөл ямар вэ?",
    type: "radio",
    options: [
      { value: "flat", label: "Тэгш" },
      { value: "slight", label: "Бага зэрэг налуу" },
      { value: "steep", label: "Их налуу" },
      { value: "unknown", label: "Мэдэхгүй" },
    ],
  },
  {
    key: "houseSize",
    icon: <Home className="w-5 h-5" />,
    label: "Хэдэн м² байшин барих вэ?",
    type: "number",
    placeholder: "жишээ: 120",
    hint: "Дундаж гэр бүлд 80-150 м² хангалттай.",
  },
  {
    key: "floors",
    icon: <Layers className="w-5 h-5" />,
    label: "Хэдэн давхар?",
    type: "radio",
    options: [
      { value: "1", label: "1 давхар" },
      { value: "2", label: "2 давхар" },
    ],
  },
  {
    key: "budgetRange",
    icon: <DollarSign className="w-5 h-5" />,
    label: "Нийт төсвийн хэмжээ?",
    type: "radio",
    options: [
      { value: "under_50m", label: "50 сая ₮-с доош" },
      { value: "50m_80m", label: "50-80 сая ₮" },
      { value: "80m_120m", label: "80-120 сая ₮" },
      { value: "120m_180m", label: "120-180 сая ₮" },
      { value: "180m_250m", label: "180-250 сая ₮" },
      { value: "over_250m", label: "250 сая ₮-с дээш" },
      { value: "unknown", label: "Тодорхойгүй" },
    ],
  },
  {
    key: "loanStatus",
    icon: <DollarSign className="w-5 h-5" />,
    label: "Зээл авах уу?",
    type: "radio",
    options: [
      { value: "yes", label: "Тийм" },
      { value: "no", label: "Үгүй" },
      { value: "maybe", label: "Магадгүй" },
    ],
  },
  {
    key: "plannedStartTime",
    icon: <Calendar className="w-5 h-5" />,
    label: "Хэзээ эхлэх вэ?",
    type: "radio",
    options: [
      { value: "this_spring", label: "Энэ хавар" },
      { value: "this_summer", label: "Энэ зун" },
      { value: "this_autumn", label: "Энэ намар" },
      { value: "this_winter", label: "Энэ өвөл" },
      { value: "next_year", label: "Ирэх жил" },
      { value: "unknown", label: "Тодорхойгүй" },
    ],
  },
  {
    key: "preferredMaterial",
    icon: <Layers className="w-5 h-5" />,
    label: "Ямар материалаар барих вэ?",
    type: "radio",
    options: [
      { value: "brick", label: "Тоосго" },
      { value: "block", label: "Блок" },
      { value: "frame", label: "Каркас (мод)" },
      { value: "sip", label: "SIP панел" },
      { value: "unsure", label: "Мэдэхгүй" },
    ],
  },
  {
    key: "buildMode",
    icon: <Hammer className="w-5 h-5" />,
    label: "Өөрөө удирдах уу, баг хөлслөх үү?",
    type: "radio",
    options: [
      { value: "self", label: "Өөрөө удирдана", description: "Ажилчдыг өөрөө хайж, удирдана" },
      { value: "hire", label: "Баг/компани хөлслөнө", description: "Мэргэжлийн гүйцэтгэгчид хариуцна" },
      { value: "mixed", label: "Хосолсон", description: "Зарим ажлыг өөрөө, зарим ажлыг хөлслөнө" },
    ],
  },
  {
    key: "familySize",
    icon: <Users className="w-5 h-5" />,
    label: "Гэр бүлийн хэдэн гишүүн амьдрах вэ?",
    type: "number",
    placeholder: "жишээ: 4",
  },
  {
    key: "residenceType",
    icon: <Home className="w-5 h-5" />,
    label: "Энэ юунд зориулагдсан вэ?",
    type: "radio",
    options: [
      { value: "primary", label: "Үндсэн амьдрах орон сууц" },
      { value: "vacation", label: "Зуслангийн байшин" },
    ],
  },
  {
    key: "currentStage",
    icon: <Target className="w-5 h-5" />,
    label: "Одоо ямар шатанд байна?",
    type: "radio",
    options: [
      { value: "thinking", label: "Зүгээр л бодож байна" },
      { value: "planning", label: "Төлөвлөж эхэлсэн" },
      { value: "land_selection", label: "Газар хайж байна" },
      { value: "design", label: "Зураг төсөл хийж байна" },
      { value: "budgeting", label: "Төсөв бэлдэж байна" },
      { value: "ready", label: "Эхлэхэд бэлэн" },
    ],
  },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const { questionnaire, setField, currentStep, setStep, setAssessment } =
    useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentValue = questionnaire[step.key];

  const canGoNext = () => {
    if (!currentValue && currentValue !== 0) return false;
    if (step.type === "number" && (currentValue as number) <= 0) return false;
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      const input = questionnaire as QuestionnaireInput;
      const result = runAssessment(input);
      setAssessment(result);
      router.push("/results");
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleRadioSelect = (value: string) => {
    if (step.key === "floors") {
      setField(step.key as "floors", parseInt(value) as 1 | 2);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setField(step.key, value as any);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="sticky top-16 z-10 bg-white border-b">
        <div className="container-app py-3">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>
              Алхам {currentStep + 1} / {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container-app py-8 max-w-2xl mx-auto px-4">
        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{DISCLAIMER_SHORT}</span>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
              {step.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step.label}
            </h2>
          </div>

          {step.hint && (
            <p className="text-sm text-gray-500 mb-4">{step.hint}</p>
          )}

          {/* Radio options */}
          {step.type === "radio" && step.options && (
            <div className="space-y-3">
              {step.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRadioSelect(opt.value)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    currentValue === opt.value ||
                      (step.key === "floors" &&
                        currentValue === parseInt(opt.value))
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="font-medium text-gray-900">{opt.label}</div>
                  {opt.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {opt.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Select dropdown */}
          {step.type === "select" && step.options && (
            <select
              value={(currentValue as string) || ""}
              onChange={(e) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setField(step.key, e.target.value as any)
              }
              className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 bg-white"
            >
              <option value="">{step.placeholder || "Сонгоно уу"}</option>
              {step.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Number input */}
          {step.type === "number" && (
            <input
              type="number"
              value={(currentValue as number) || ""}
              onChange={(e) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setField(step.key, parseInt(e.target.value) || 0 as any)
              }
              placeholder={step.placeholder}
              min={1}
              className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 text-lg"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
              currentStep === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Өмнөх
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext() || isSubmitting}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors",
              canGoNext() && !isSubmitting
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              "Боловсруулж байна..."
            ) : isLastStep ? (
              "Дүн гаргах"
            ) : (
              <>
                Дараах
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
