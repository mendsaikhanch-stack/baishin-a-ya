// ============================================================
// Байшин А-Я — Project type + budget range баримжаа.
// Questionnaire input-аас одоо байгаа estimator engine-руу зууж,
// /results preview болон PDF тайланд адил утгуудыг харуулна.
// Энэ нь зөвхөн АНХНЫ БАРИМЖАА — албан ёсны төсөв биш.
// ============================================================

import { estimate } from "@/lib/estimator";
import type {
  HouseType,
  Floors,
  Location,
  Quality,
} from "@/lib/estimator/types";
import type { QuestionnaireInput, PreferredMaterial } from "@/lib/types";

// Questionnaire-ийн материал → estimator-ийн house type
const MATERIAL_TO_TYPE: Record<PreferredMaterial, HouseType> = {
  brick: "concrete", // estimator's "concrete" нь хатуу материалд (тоосго орно)
  block: "block",
  frame: "frame",
  sip: "frame", // SIP нь мод-каркас гэр бүлд хамаарна
  unsure: "block", // дунд хувилбараар үнэлнэ
};

const TYPE_LABELS: Record<HouseType, string> = {
  frame: "Каркас",
  block: "Блок",
  concrete: "Тоосго / бетон",
};

// Questionnaire-ийн материал → хэрэглэгчийн нүдээр уншихуйц нэр
const MATERIAL_LABELS: Record<PreferredMaterial, string> = {
  brick: "Тоосгон байшин",
  block: "Блок байшин",
  frame: "Каркас байшин",
  sip: "SIP панел байшин",
  unsure: "Шийдээгүй (Блок гэж үнэллээ)",
};

export type ProjectPreview = {
  // Хэрэглэгчид харуулах нэр (preferredMaterial-аас урган гарсан)
  projectTypeLabel: string;
  // estimator-ийн дотоод төрөл
  estimatorType: HouseType;
  // Тооцоолсон төсвийн дунж — нэг хязгаар (margin шинж бус)
  budgetMin: number;
  budgetMax: number;
  // Хугацааны баримжаа (сар)
  durationMonthsMin: number;
  durationMonthsMax: number;
};

/**
 * Questionnaire-аас project type + тооцоолсон төсвийн муж буцаана.
 * Шаардлагатай талбар: houseSize. Бусдыг default-р хангана.
 * Талбар дутуу бол null буцаана.
 */
export function buildProjectPreview(
  q: Partial<QuestionnaireInput>,
): ProjectPreview | null {
  if (!q.houseSize || q.houseSize <= 0) return null;

  const material: PreferredMaterial = q.preferredMaterial ?? "unsure";
  const type: HouseType = MATERIAL_TO_TYPE[material] ?? "block";
  const floors: Floors = q.floors === 2 ? 2 : 1;
  const location: Location = q.urbanOrRural === "rural" ? "rural" : "city";
  const quality: Quality = "medium"; // questionnaire дээр чанарын асуулт байхгүй

  const result = estimate({
    size_m2: q.houseSize,
    floors,
    location,
    quality,
    type,
  });

  return {
    projectTypeLabel:
      material === "unsure" ? TYPE_LABELS[type] : MATERIAL_LABELS[material],
    estimatorType: type,
    budgetMin: result.price_total.min,
    budgetMax: result.price_total.max,
    durationMonthsMin: result.duration_months.min,
    durationMonthsMax: result.duration_months.max,
  };
}

/** Сая ₮-ээр форматлах (₮96,000,000 → "96 сая") */
export function formatMnt(amount: number): string {
  const m = Math.round(amount / 1_000_000);
  return `${m} сая ₮`;
}
