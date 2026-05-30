// ============================================================
// БОСГО — Асуумжийн сонголтын дундын тодорхойлолт.
// Questionnaire wizard (src/app/questionnaire/page.tsx) болон
// амьд засвар editor (src/components/results/LivePlanEditor.tsx)
// хоёул эндээс уншина — давхардал, drift-ээс сэргийлнэ.
// ============================================================

export type FieldOption = {
  value: string;
  label: string;
  sub?: string;
};

export const MATERIAL_OPTIONS: FieldOption[] = [
  { value: "brick", label: "Тоосго" },
  { value: "block", label: "Блок" },
  { value: "frame", label: "Каркас (мод)" },
  { value: "sip", label: "SIP панел" },
  { value: "unsure", label: "Одоогоор шийдээгүй" },
];

export const FLOOR_OPTIONS: FieldOption[] = [
  { value: "1", label: "1 давхар" },
  { value: "2", label: "2 давхар" },
];

export const RESIDENCE_OPTIONS: FieldOption[] = [
  { value: "primary", label: "Байнга амьдрах байшин" },
  { value: "vacation", label: "Зуслан / амралтын байшин" },
];

export const BUDGET_OPTIONS: FieldOption[] = [
  { value: "under_50m", label: "50 сая ₮-с доош" },
  { value: "50m_80m", label: "50–80 сая ₮" },
  { value: "80m_120m", label: "80–120 сая ₮" },
  { value: "120m_180m", label: "120–180 сая ₮" },
  { value: "180m_250m", label: "180–250 сая ₮" },
  { value: "over_250m", label: "250 сая ₮-с дээш" },
  { value: "unknown", label: "Тодорхойгүй" },
];

export const URBAN_RURAL_OPTIONS: FieldOption[] = [
  { value: "urban", label: "Хот, суурин газар" },
  { value: "rural", label: "Хөдөө, орон нутаг" },
];

export const SLOPE_OPTIONS: FieldOption[] = [
  { value: "flat", label: "Тэгш" },
  { value: "slight", label: "Бага налуу" },
  { value: "steep", label: "Их налуу" },
  { value: "unknown", label: "Мэдэхгүй" },
];

export const BUILD_MODE_OPTIONS: FieldOption[] = [
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
];
