// ============================================================
// БОСГО — Application Constants
// ============================================================

export const APP_NAME = "БОСГО";
export const APP_TAGLINE = "Байшингаа бүтээх замд тань туслах ухаалаг туслах";
export const APP_DESCRIPTION =
  "Монголд хувийн байшин барихыг хүссэн хүн бүрт зориулсан алхам алхмаар төлөвлөлтийн туслах.";

export const DISCLAIMER_TEXT =
  "Энэхүү тайлан нь инженерийн зураг төсөл, мэргэжлийн төсөвчин, архитектор, барилгын инженерийн дүгнэлтийг орлохгүй. Зөвхөн эхний шатны төлөвлөлт, төсвийн баримжаа, эрсдэл ойлгох, ажлын дараалал гаргах зориулалттай.";

export const DISCLAIMER_SHORT =
  "⚠️ Энэ нь зөвлөгөө бөгөөд албан ёсны инженерийн тооцоо биш.";

// Budget ranges in MNT (₮)
export const BUDGET_RANGES = {
  under_50m: { min: 0, max: 50_000_000, label: "50 сая ₮-с доош" },
  "50m_80m": { min: 50_000_000, max: 80_000_000, label: "50-80 сая ₮" },
  "80m_120m": { min: 80_000_000, max: 120_000_000, label: "80-120 сая ₮" },
  "120m_180m": { min: 120_000_000, max: 180_000_000, label: "120-180 сая ₮" },
  "180m_250m": { min: 180_000_000, max: 250_000_000, label: "180-250 сая ₮" },
  over_250m: { min: 250_000_000, max: Infinity, label: "250 сая ₮-с дээш" },
  unknown: { min: 0, max: 0, label: "Тодорхойгүй" },
} as const;

// Average cost per m² in MNT (rough guidance for MVP)
export const COST_PER_SQM = {
  budget: 800_000,    // Хэмнэлттэй
  standard: 1_200_000, // Дундаж
  quality: 1_800_000,  // Чанартай
  premium: 2_500_000,  // Дээд зэрэг
} as const;

export const PROVINCES = [
  "Улаанбаатар",
  "Дархан-Уул",
  "Орхон",
  "Сэлэнгэ",
  "Төв",
  "Булган",
  "Архангай",
  "Өвөрхангай",
  "Баянхонгор",
  "Говь-Алтай",
  "Завхан",
  "Увс",
  "Ховд",
  "Баян-Өлгий",
  "Хөвсгөл",
  "Дорнод",
  "Сүхбаатар",
  "Хэнтий",
  "Дундговь",
  "Дорноговь",
  "Өмнөговь",
  "Говьсүмбэр",
] as const;

export const CONTENT_CATEGORIES = [
  { id: "before_starting", label: "Эхлэхээс өмнө", icon: "BookOpen" },
  { id: "land_selection", label: "Газар сонголт", icon: "MapPin" },
  { id: "budget_planning", label: "Төсөв төлөвлөлт", icon: "Calculator" },
  { id: "house_sizing", label: "Талбай төлөвлөлт", icon: "Ruler" },
  { id: "material_selection", label: "Материал сонголт", icon: "Layers" },
  { id: "foundation", label: "Суурь", icon: "Building" },
  { id: "seasonal_timing", label: "Улирлын төлөвлөлт", icon: "Calendar" },
  { id: "hiring", label: "Ажилчин, гүйцэтгэгч", icon: "Users" },
  { id: "common_mistakes", label: "Нийтлэг алдаа", icon: "AlertTriangle" },
  { id: "final_stage", label: "Эцсийн шат", icon: "CheckCircle" },
] as const;

export const EXPERT_TYPES = [
  { id: "architect", name: "Архитектор", icon: "Compass", when: "Зураг төсөл хийхэд" },
  { id: "structural_engineer", name: "Бүтээцийн инженер", icon: "Building", when: "Суурь, бүтээцийн тооцоо" },
  { id: "surveyor", name: "Геодезист", icon: "MapPin", when: "Газрын хэмжилт хийхэд" },
  { id: "contractor", name: "Гүйцэтгэгч компани", icon: "HardHat", when: "Барилга угсралт эхлэхэд" },
  { id: "electrician", name: "Цахилгаанчин", icon: "Zap", when: "Цахилгааны систем суурилуулахад" },
  { id: "plumber", name: "Сантехникч", icon: "Droplets", when: "Сантехникийн ажил хийхэд" },
  { id: "financial_advisor", name: "Санхүүгийн зөвлөгч", icon: "DollarSign", when: "Зээл, төсвийн зөвлөгөө авахад" },
  { id: "lawyer", name: "Хуульч", icon: "Scale", when: "Газрын эрх, гэрээний асуудалд" },
  { id: "supplier", name: "Материал нийлүүлэгч", icon: "Package", when: "Материал худалдан авахад" },
] as const;
