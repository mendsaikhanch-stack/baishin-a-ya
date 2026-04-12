// ============================================================
// Risk Assessment Engine
// Identifies top risks based on user's situation
// ============================================================

import type { QuestionnaireInput, Risk, RiskLevel } from "@/lib/types";
import { BUDGET_RANGES, COST_PER_SQM } from "@/lib/constants";

export function assessRisks(input: QuestionnaireInput): Risk[] {
  const risks: Risk[] = [];

  // 1. No land risk
  if (input.landOwned === "no") {
    risks.push({
      id: "no_land",
      title: "Газар олоогүй байна",
      description:
        "Газаргүйгээр барилга эхлэх боломжгүй. Газар олох, бүртгүүлэх процесс хугацаа шаарддаг.",
      level: "high",
      suggestion:
        "Эхлээд газрын асуудлыг шийдвэрлэнэ үү. Газрын алба, дүүргийн засаг захиргаатай холбогдоно уу.",
    });
  }

  // 2. Budget risk — budget too low for desired house size
  if (input.budgetRange !== "unknown") {
    const budgetInfo = BUDGET_RANGES[input.budgetRange];
    const estimatedCost = input.houseSize * COST_PER_SQM.standard;

    if (budgetInfo.max < estimatedCost * 0.7) {
      risks.push({
        id: "budget_low",
        title: "Төсөв хүрэлцэхгүй байж магадгүй",
        description: `${input.houseSize}м² байшинд ойролцоогоор ${Math.round(estimatedCost / 1_000_000)} сая ₮ хэрэгтэй. Таны төсөв бага байж магадгүй.`,
        level: "high",
        suggestion:
          "Байшингийн хэмжээг багасгах, эсвэл төсвийг нэмэгдүүлэх талаар бодоорой. Мэргэжлийн хүнтэй зөвлөлдөөрэй.",
      });
    } else if (budgetInfo.max < estimatedCost) {
      risks.push({
        id: "budget_tight",
        title: "Төсөв хязгаарлагдмал",
        description:
          "Таны төсөв хүрч болох ч нөөц бараг үлдэхгүй. Гэнэтийн зардал гарвал хүндрэлтэй.",
        level: "medium",
        suggestion:
          "Нийт төсвийн 10-15%-ийг нөөцөд үлдээхийг зөвлөж байна.",
      });
    }
  } else {
    risks.push({
      id: "budget_unknown",
      title: "Төсөв тодорхойгүй",
      description:
        "Төсвөө тодорхойлоогүй байх нь хамгийн том алдаануудын нэг.",
      level: "high",
      suggestion:
        "Эхлээд нийт зарлагаа тооцоолж, санхүүгийн боломжоо тодорхойлоорой.",
    });
  }

  // 3. Winter timing risk
  if (
    input.plannedStartTime === "this_winter" ||
    input.plannedStartTime === "this_autumn"
  ) {
    risks.push({
      id: "winter_start",
      title: "Өвлийн улиралд эхлэх эрсдэл",
      description:
        "Монголын өвөл -30°C хүртэл хүйтэрдэг. Суурь, бетоны ажил хүйтэнд чанаргүй болдог.",
      level:
        input.plannedStartTime === "this_winter" ? "high" : ("medium" as RiskLevel),
      suggestion:
        "Суурийн ажлыг хавар/зунд хийж, өвлийг дотоод заслын ажилд зарцуулахыг зөвлөж байна.",
    });
  }

  // 4. Self-manage risk for beginners
  if (input.buildMode === "self" && input.currentStage === "thinking") {
    risks.push({
      id: "self_manage_risk",
      title: "Өөрөө удирдах нь хүнд байж магадгүй",
      description:
        "Туршлагагүй хүн барилга өөрөө удирдвал алдаа их гардаг, хугацаа удаашрана.",
      level: "medium",
      suggestion:
        "Дор хаяж туршлагатай нэг мэргэжилтнийг зөвлөхөөр авахыг зөвлөж байна.",
    });
  }

  // 5. Steep land risk
  if (input.landSlope === "steep") {
    risks.push({
      id: "steep_land",
      title: "Налуу газрын нэмэлт зардал",
      description:
        "Их налуу газарт суурийн ажил илүү нарийн, үнэтэй байдаг.",
      level: "medium",
      suggestion:
        "Геодезист, бүтээцийн инженерээр газрыг шалгуулахыг заавал зөвлөж байна.",
    });
  }

  // 6. Loan + tight budget risk
  if (
    input.loanStatus === "yes" &&
    ["under_50m", "50m_80m"].includes(input.budgetRange)
  ) {
    risks.push({
      id: "loan_risk",
      title: "Зээлийн ачааллын эрсдэл",
      description:
        "Бага төсөвтэйгөөр зээл авах нь сарын төлбөрт ачаалал ихэсгэнэ.",
      level: "medium",
      suggestion:
        "Зээлийн сарын төлбөр нь цалингийн 30%-аас хэтрэхгүй байхыг зөвлөж байна. Санхүүгийн зөвлөгч авах хэрэгтэй.",
    });
  }

  // 7. Large house for small budget
  if (
    input.houseSize > 150 &&
    ["under_50m", "50m_80m"].includes(input.budgetRange)
  ) {
    risks.push({
      id: "size_budget_mismatch",
      title: "Хэмжээ ба төсвийн зөрчил",
      description: `${input.houseSize}м² байшин барихад тань ${BUDGET_RANGES[input.budgetRange].label} хүрэлцэхгүй байж магадгүй.`,
      level: "high",
      suggestion:
        "100-120м² хэмжээнд багасгах, эсвэл шаталсан барилга хийхийг бодоорой.",
    });
  }

  // 8. Two floors without clear budget
  if (input.floors === 2 && input.budgetRange === "unknown") {
    risks.push({
      id: "two_floor_budget",
      title: "2 давхарт нэмэлт зардал",
      description:
        "2 давхар байшин нь 1 давхраас 40-60% илүү зардалтай байдаг.",
      level: "medium",
      suggestion: "Төсвөө тодорхойлсны дараа давхрын тоог шийдэхийг зөвлөж байна.",
    });
  }

  // Sort by severity
  const levelOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
  risks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return risks.slice(0, 5); // Top 5 risks
}
