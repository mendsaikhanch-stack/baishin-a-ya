// ============================================================
// Recommendation Engine
// Generates next steps, expert suggestions, and budget notes
// based on user's questionnaire responses
// ============================================================

import type {
  QuestionnaireInput,
  NextStep,
  ExpertSuggestion,
  RecommendedTrack,
} from "@/lib/types";
import { BUDGET_RANGES, COST_PER_SQM } from "@/lib/constants";

export function determineTrack(input: QuestionnaireInput): RecommendedTrack {
  // Decision tree for recommended track
  if (input.landOwned === "no") return "land_first";
  if (input.budgetRange === "unknown") return "finance_first";
  if (input.preferredMaterial === "unsure") return "material_research";
  if (["thinking", "planning", "land_selection"].includes(input.currentStage)) {
    return "planning";
  }
  return "execution";
}

export function generateNextSteps(input: QuestionnaireInput): NextStep[] {
  const steps: NextStep[] = [];
  const track = determineTrack(input);
  let order = 1;

  // Track-specific steps
  if (track === "land_first") {
    steps.push({
      id: "step_land_1",
      order: order++,
      title: "Газар хайх эхлэх",
      description:
        "Барих хүссэн бүс нутгаасаа газар хайж, газрын үнэ, байршлыг судалж эхлээрэй.",
      actionable: true,
    });
    steps.push({
      id: "step_land_2",
      order: order++,
      title: "Газрын албатай холбогдох",
      description:
        "Тухайн дүүрэг/аймгийн газрын албанаас газар авах журам, шаардлагыг лавлаарай.",
      actionable: true,
    });
  }

  if (track === "finance_first") {
    steps.push({
      id: "step_fin_1",
      order: order++,
      title: "Нийт зардлаа тооцоолох",
      description:
        "Газар, барилга, дотоод засал, инженерийн шугам бүгдийн зардлыг нэгтгэж тооцоолоорой.",
      actionable: true,
    });
    steps.push({
      id: "step_fin_2",
      order: order++,
      title: "Санхүүгийн боломжоо шалгах",
      description:
        "Хадгаламж, зээлийн боломж, сарын орлогоо харгалзан төсвөө тогтооно уу.",
      actionable: true,
    });
  }

  if (track === "material_research") {
    steps.push({
      id: "step_mat_1",
      order: order++,
      title: "Материалуудыг харьцуулж судлах",
      description:
        "Тоосго, блок, каркас зэрэг материалуудын давуу болон сул талыг судалж, өөрт тохирохыг сонгоорой.",
      actionable: true,
    });
  }

  // Common steps for all tracks
  if (input.currentStage === "thinking" || input.currentStage === "planning") {
    steps.push({
      id: "step_common_1",
      order: order++,
      title: "Гэр бүлийн хэрэгцээг тодорхойлох",
      description:
        "Хэдэн өрөө хэрэгтэй, ямар зохион байгуулалттай байхыг гэр бүлээрээ ярилцаарай.",
      actionable: true,
    });
  }

  steps.push({
    id: "step_common_2",
    order: order++,
    title: "Архитектортой зөвлөлдөх",
    description:
      "Зураг төсөл хийлгэхийн өмнө мэргэжлийн архитектортой уулзаж зөвлөгөө аваарай.",
    actionable: true,
  });

  if (input.landOwned === "yes" && input.landSlope !== "flat") {
    steps.push({
      id: "step_survey",
      order: order++,
      title: "Газрын хэмжилт хийлгэх",
      description:
        "Геодезистээр газрынхаа хэмжилт, түвшин тогтоолгоорой.",
      actionable: true,
    });
  }

  // Budget-related step
  if (input.budgetRange !== "unknown") {
    const budgetInfo = BUDGET_RANGES[input.budgetRange];
    const estimatedCost = input.houseSize * COST_PER_SQM.standard;
    if (budgetInfo.max < estimatedCost) {
      steps.push({
        id: "step_budget_adjust",
        order: order++,
        title: "Төсөв ба хэмжээг тохируулах",
        description:
          "Таны төсөв хүссэн хэмжээнд хүрэхгүй байж магадгүй. Хэмжээ багасгах эсвэл шаталсан барилга бодоорой.",
        actionable: true,
      });
    }
  }

  return steps.slice(0, 5);
}

export function suggestExperts(input: QuestionnaireInput): ExpertSuggestion[] {
  const suggestions: ExpertSuggestion[] = [];

  // Architect — almost always needed
  suggestions.push({
    id: "expert_arch",
    type: "architect",
    title: "Архитектор",
    reason: "Зураг төсөл заавал мэргэжлийн архитектороор хийлгэх шаардлагатай.",
    timing:
      input.currentStage === "design"
        ? "Одоо"
        : "Газар, төсвийг шийдсэний дараа",
    priority: "required",
  });

  // Structural engineer
  if (input.floors === 2 || input.landSlope === "steep") {
    suggestions.push({
      id: "expert_struct",
      type: "structural_engineer",
      title: "Бүтээцийн инженер",
      reason:
        input.floors === 2
          ? "2 давхар байшинд бүтээцийн тооцоо заавал хэрэгтэй."
          : "Налуу газарт суурийн тооцоо заавал хэрэгтэй.",
      timing: "Зураг төслийн шатанд",
      priority: "required",
    });
  }

  // Surveyor
  if (
    input.landOwned === "yes" &&
    input.landSlope !== "flat"
  ) {
    suggestions.push({
      id: "expert_survey",
      type: "surveyor",
      title: "Геодезист",
      reason: "Газрын түвшин, хэмжилтийг мэргэжлийн хүнээр хийлгэх хэрэгтэй.",
      timing: "Зураг төсөл эхлэхээс өмнө",
      priority: "recommended",
    });
  }

  // Financial advisor
  if (input.loanStatus === "yes" || input.loanStatus === "maybe") {
    suggestions.push({
      id: "expert_fin",
      type: "financial_advisor",
      title: "Санхүүгийн зөвлөгч",
      reason: "Зээлийн нөхцөл, төлбөрийн чадварыг мэргэжилтэнтэй ярилцах нь зүйтэй.",
      timing: "Төсөв тогтоохоос өмнө",
      priority: "recommended",
    });
  }

  // Lawyer for land
  if (input.landOwned === "no") {
    suggestions.push({
      id: "expert_law",
      type: "lawyer",
      title: "Хуульч",
      reason: "Газар худалдан авахад гэрээ, эрхийн асуудлыг хуульчаар шалгуулах хэрэгтэй.",
      timing: "Газар худалдаж авахаас өмнө",
      priority: "recommended",
    });
  }

  // Contractor
  if (input.buildMode === "hire" || input.buildMode === "mixed") {
    suggestions.push({
      id: "expert_contractor",
      type: "contractor",
      title: "Гүйцэтгэгч компани",
      reason: "Найдвартай гүйцэтгэгч сонгох нь барилгын чанар, хугацаанд шууд нөлөөлнө.",
      timing: "Зураг төсөл дууссаны дараа",
      priority: "recommended",
    });
  }

  return suggestions;
}

export function generateBudgetNotes(input: QuestionnaireInput): string[] {
  const notes: string[] = [];

  if (input.budgetRange === "unknown") {
    notes.push(
      "Төсвөө аль болох эрт тодорхойлох нь хамгийн чухал алхмуудын нэг."
    );
    return notes;
  }

  const budgetInfo = BUDGET_RANGES[input.budgetRange];
  const estimatedMin = input.houseSize * COST_PER_SQM.budget;
  const estimatedStd = input.houseSize * COST_PER_SQM.standard;

  notes.push(
    `${input.houseSize}м² байшинд ойролцоогоор ${Math.round(estimatedMin / 1_000_000)}-${Math.round(estimatedStd / 1_000_000)} сая ₮ хэрэгтэй (дундаж тооцоо).`
  );

  notes.push(
    "Нийт төсвийн 10-15%-ийг гэнэтийн зардалд зориулж нөөцөлж үлдээгээрэй."
  );

  if (input.loanStatus === "yes") {
    notes.push(
      "Зээлийн сарын төлбөр орлогын 30%-аас хэтрэхгүй байхыг зөвлөж байна."
    );
  }

  if (input.floors === 2) {
    notes.push(
      "2 давхар байшин нь ижил талбайтай 1 давхраас 40-60% илүү зардалтай."
    );
  }

  if (input.landSlope === "steep") {
    notes.push("Налуу газарт суурийн зардал тэгш газраас 20-40% илүү байдаг.");
  }

  notes.push(
    "⚠️ Дээрх тоо нь ойролцоо тооцоо бөгөөд мэргэжлийн төсөвчнөөс нарийн тооцоо гаргуулаарай."
  );

  return notes;
}
