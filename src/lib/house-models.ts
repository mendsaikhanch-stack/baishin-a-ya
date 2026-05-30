// ============================================================
// БОСГО — Байшингийн загварын каталог
// ------------------------------------------------------------
// Хэрэглэгч асуумжийн ЭХНИЙ алхамд "мөрөөдлийн загвараа" сонгоно.
// Энэ нь сэтгэл татах орох цэг (дэгээ) бөгөөд материал, давхар,
// зориулалт, хэмжээг дараагийн алхмуудад урьдчилан бөглөнө.
//
// Зураг хараахан байхгүй — карт бүр lucide icon + хэв маягийн
// өнгөөр илэрхийлэгдэнэ. Дараа бодит зураг нэмж болно.
// ============================================================

import {
  Home,
  Building2,
  Warehouse,
  Tent,
  TreePine,
  Castle,
  Hotel,
  Box,
  Boxes,
  Mountain,
  Landmark,
  Building,
  type LucideIcon,
} from "lucide-react";
import type { PreferredMaterial, ResidenceType, FloorCount } from "@/lib/types";

export type ModelTier = "economy" | "mid" | "premium";

export interface HouseModel {
  id: string;
  /** Хэрэглэгчид харагдах нэр */
  name: string;
  /** Нэг мөрийн товч тайлбар */
  tagline: string;
  /** Хэв маягийн ангилал (badge) */
  archetype: string;
  icon: LucideIcon;
  /** Картын өнгөний хэв (tailwind-friendly key) */
  accent: "blue" | "emerald" | "amber" | "violet" | "rose" | "slate";

  // — Урьдчилан бөглөх утгууд —
  floors: FloorCount;
  material: PreferredMaterial;
  residenceType: ResidenceType;
  /** Ердийн талбайн муж (м²) */
  sizeMin: number;
  sizeMax: number;
  /** Асуумжид анхдагчаар тавих талбай (м²) */
  defaultSize: number;

  // — Төсвийн баримжаа —
  /** м² тутмын өртөг (₮) */
  costPerM2Min: number;
  costPerM2Max: number;
  tier: ModelTier;

  /** 2–4 гол онцлог */
  features: string[];
  /** Хэнд тохирох */
  bestFor: string;
  /** Инженерийн анхааруулга */
  watchOut: string;
}

export const TIER_LABELS: Record<ModelTier, string> = {
  economy: "Эдийн засгийн",
  mid: "Дунд зэрэг",
  premium: "Премиум",
};

export const MODEL_MATERIAL_LABELS: Record<PreferredMaterial, string> = {
  brick: "Тоосго",
  block: "Блок",
  frame: "Каркас (мод)",
  sip: "SIP панел",
  unsure: "Холимог",
};

// ────────────────────────────────────────────
// Каталог — 14 архетип
// Өртгийн утгууд нь ₮/м² (УБ хотын дунд зэрэг чанараар, баримжаа).
// ────────────────────────────────────────────

export const HOUSE_MODELS: HouseModel[] = [
  {
    id: "frame-cabin-economy",
    name: "Авсаархан каркас зуслан",
    tagline: "Хурдан босдог, хямд, амралтын зориулалттай",
    archetype: "Зуслан",
    icon: Tent,
    accent: "emerald",
    floors: 1,
    material: "frame",
    residenceType: "vacation",
    sizeMin: 40,
    sizeMax: 70,
    defaultSize: 55,
    costPerM2Min: 1_600_000,
    costPerM2Max: 2_200_000,
    tier: "economy",
    features: [
      "2–3 сард угсардаг",
      "Зөөврийн суурь боломжтой",
      "Зуны улиралд тохиромжтой",
    ],
    bestFor: "Хот орчмын зуслан, амралтын газар хүсэгчид",
    watchOut: "Өвөл байнга амьдрахад изоляц, усны системийг хүчтэй болгох ёстой",
  },
  {
    id: "scandi-minimal-1",
    name: "Скандинав минимал 1 давхар",
    tagline: "Цэвэрхэн шугам, том цонх, дулаан хэмнэлттэй",
    archetype: "Минимал",
    icon: Home,
    accent: "slate",
    floors: 1,
    material: "frame",
    residenceType: "primary",
    sizeMin: 70,
    sizeMax: 110,
    defaultSize: 90,
    costPerM2Min: 2_000_000,
    costPerM2Max: 2_800_000,
    tier: "mid",
    features: [
      "Эрчим хүч хэмнэлттэй",
      "Нээлттэй төлөвлөлт",
      "Орчин үеийн дүр төрх",
    ],
    bestFor: "Залуу гэр бүл, чанартай гэхдээ авсаархан байшин хүсэгчид",
    watchOut: "Том цонх дулаалгын чанараас ихээхэн хамаарна",
  },
  {
    id: "modern-block-1",
    name: "Орчин үеийн 1 давхар блок",
    tagline: "Тэнцвэртэй өртөг, бат бөх, өргөн дэлгэрсэн",
    archetype: "Орчин үеийн",
    icon: Building,
    accent: "blue",
    floors: 1,
    material: "block",
    residenceType: "primary",
    sizeMin: 90,
    sizeMax: 130,
    defaultSize: 110,
    costPerM2Min: 2_000_000,
    costPerM2Max: 2_600_000,
    tier: "mid",
    features: [
      "Бат бөх блок хана",
      "Засвар арчилгаа хялбар",
      "Гэр бүлд тохиромжтой хэмжээ",
    ],
    bestFor: "Дунд орлоготой гэр бүл, байнга амьдрах байшин",
    watchOut: "Блокийн дулаалгыг гадна талаас зайлшгүй нэмэх шаардлагатай",
  },
  {
    id: "classic-brick-2",
    name: "Сонгодог 2 давхар тоосго",
    tagline: "Уламжлалт, бат бөх, 80+ жилийн насжилт",
    archetype: "Сонгодог",
    icon: Castle,
    accent: "rose",
    floors: 2,
    material: "brick",
    residenceType: "primary",
    sizeMin: 140,
    sizeMax: 200,
    defaultSize: 170,
    costPerM2Min: 2_800_000,
    costPerM2Max: 3_600_000,
    tier: "premium",
    features: [
      "Маш урт ашиглалтын хугацаа",
      "Дуу, дулаан тусгаарлалт сайн",
      "Дахин борлуулах үнэ өндөр",
    ],
    bestFor: "Удаан хугацаанд амьдрах, чанарт ач холбогдол өгдөг гэр бүл",
    watchOut: "Тоосон 2 давхар хүнд тул хөрс сул бол суурь үнэтэй болно",
  },
  {
    id: "family-block-2",
    name: "Том гэр бүлийн 2 давхар блок",
    tagline: "Олон өрөө, боломжийн өртөг, өргөтгөх боломжтой",
    archetype: "Гэр бүлийн",
    icon: Hotel,
    accent: "blue",
    floors: 2,
    material: "block",
    residenceType: "primary",
    sizeMin: 150,
    sizeMax: 220,
    defaultSize: 185,
    costPerM2Min: 2_200_000,
    costPerM2Max: 2_800_000,
    tier: "mid",
    features: [
      "Олон унтлагын өрөө",
      "2 давхарт суурь хэмнэнэ",
      "Тоосгоноос хямд",
    ],
    bestFor: "6+ гишүүнтэй том гэр бүл",
    watchOut: "Давхар хоорондын халаалт, дуу тусгаарлалтыг сайн төлөвлө",
  },
  {
    id: "a-frame-cabin",
    name: "А-хэлбэр налуу дээвэр зуслан",
    tagline: "Онцлог дүр төрх, цас бороонд тэсвэртэй",
    archetype: "А-фрэйм",
    icon: TreePine,
    accent: "emerald",
    floors: 1,
    material: "frame",
    residenceType: "vacation",
    sizeMin: 50,
    sizeMax: 90,
    defaultSize: 65,
    costPerM2Min: 1_800_000,
    costPerM2Max: 2_600_000,
    tier: "mid",
    features: [
      "Эрс налуу дээвэр — цас тогтохгүй",
      "Дотор өндөр тааз",
      "Байгальд зохицсон дүр",
    ],
    bestFor: "Уулын бэл, ой модтой газрын амралтын байшин",
    watchOut: "Налуу хана ашиглах талбайг багасгадаг — зохион байгуулалт чухал",
  },
  {
    id: "sip-warm-1",
    name: "SIP дулаан хэмнэлттэй 1 давхар",
    tagline: "Хамгийн дулаан, угсралт хурдан, эрчим хүч хэмнэнэ",
    archetype: "Эрчим хүч хэмнэлттэй",
    icon: Box,
    accent: "amber",
    floors: 1,
    material: "sip",
    residenceType: "primary",
    sizeMin: 80,
    sizeMax: 120,
    defaultSize: 100,
    costPerM2Min: 2_000_000,
    costPerM2Max: 2_800_000,
    tier: "mid",
    features: [
      "Маш сайн дулаалга (-40°C-д тохиромжтой)",
      "1–2 сард угсардаг",
      "Халаалтын зардал бага",
    ],
    bestFor: "Эрчим хүчний зардлаа багасгахыг хүсэгчид",
    watchOut: "Чанартай SIP панел, агааржуулалтын систем зайлшгүй шаардана",
  },
  {
    id: "premium-brick-2",
    name: "Премиум 2 давхар тоосго",
    tagline: "Гараж, подвалтай, дээд зэрэглэлийн байшин",
    archetype: "Премиум",
    icon: Landmark,
    accent: "rose",
    floors: 2,
    material: "brick",
    residenceType: "primary",
    sizeMin: 200,
    sizeMax: 300,
    defaultSize: 240,
    costPerM2Min: 3_200_000,
    costPerM2Max: 4_200_000,
    tier: "premium",
    features: [
      "Дотор гараж + подвал",
      "Өндөр зэрэглэлийн засал",
      "Олон жилийн баталгаат бат бөх",
    ],
    bestFor: "Том төсөвтэй, дээд зэрэглэлийн орон сууц хүсэгчид",
    watchOut: "Подвал, гараж нь газрын усны түвшин, хөрсний шинжилгээ шаарддаг",
  },
  {
    id: "starter-block-1",
    name: "Эдийн засгийн 1 давхар блок",
    tagline: "Анхны байшин, хамгийн боломжийн төсөв",
    archetype: "Эдийн засгийн",
    icon: Home,
    accent: "emerald",
    floors: 1,
    material: "block",
    residenceType: "primary",
    sizeMin: 60,
    sizeMax: 90,
    defaultSize: 75,
    costPerM2Min: 1_800_000,
    costPerM2Max: 2_400_000,
    tier: "economy",
    features: [
      "Хамгийн бага босдог төсөв",
      "Дараа өргөтгөх боломжтой",
      "Энгийн зохион байгуулалт",
    ],
    bestFor: "Анх удаа байшин барьж буй залуу гэр бүл",
    watchOut: "Ирээдүйд өргөтгөхөөр бол сууриа эхнээс нь том төлөвлө",
  },
  {
    id: "l-shape-1",
    name: "L-хэлбэр хашаатай 1 давхар",
    tagline: "Хаалттай хашаа, нарлаг тагт, тав тухтай",
    archetype: "Хашаатай",
    icon: Warehouse,
    accent: "amber",
    floors: 1,
    material: "brick",
    residenceType: "primary",
    sizeMin: 110,
    sizeMax: 160,
    defaultSize: 135,
    costPerM2Min: 2_400_000,
    costPerM2Max: 3_000_000,
    tier: "mid",
    features: [
      "Хамгаалагдсан дотоод хашаа",
      "Нарны чиглэлд тааруулсан",
      "Ахмад, хүүхдэд аюулгүй (шатгүй)",
    ],
    bestFor: "Өргөн талбайтай газартай, хашаандаа амрах дуртай гэр бүл",
    watchOut: "L-хэлбэр суурь, дээврийн талбайг ихэсгэж өртөг нэмдэг",
  },
  {
    id: "modern-cube-2",
    name: "Модерн куб 2 давхар",
    tagline: "Тэгш дээвэр, том шил, орчин үеийн дизайн",
    archetype: "Орчин үеийн",
    icon: Boxes,
    accent: "violet",
    floors: 2,
    material: "block",
    residenceType: "primary",
    sizeMin: 130,
    sizeMax: 180,
    defaultSize: 155,
    costPerM2Min: 2_600_000,
    costPerM2Max: 3_400_000,
    tier: "premium",
    features: [
      "Тэгш (flat) дээвэр — дээвэр-тагт",
      "Панорам цонх",
      "Дэгжин орчин үеийн дүр",
    ],
    bestFor: "Орчин үеийн дизайнд дуртай, хотын захын газартай хүмүүс",
    watchOut: "Тэгш дээвэр Монголын цас, борооны ус зайлуулалт сайн шаардана",
  },
  {
    id: "sip-tiny-vacation",
    name: "Жижиг SIP амралтын байшин",
    tagline: "Маш авсаархан, дулаан, ганц бие/хосд",
    archetype: "Зуслан",
    icon: Box,
    accent: "emerald",
    floors: 1,
    material: "sip",
    residenceType: "vacation",
    sizeMin: 35,
    sizeMax: 60,
    defaultSize: 45,
    costPerM2Min: 1_800_000,
    costPerM2Max: 2_400_000,
    tier: "economy",
    features: [
      "1 сард угсардаг",
      "Бага эрчим хүч шаардана",
      "Жижиг газарт багтана",
    ],
    bestFor: "Хос эсвэл ганц бие, амралтын жижиг байшин хүсэгчид",
    watchOut: "Талбай бага тул хадгалалт, агуулахын зайг сайн төлөвлө",
  },
  {
    id: "loft-frame-2",
    name: "Лофт маягийн каркас (1.5 давхар)",
    tagline: "Өндөр тааз, антресоль, залуу маяг",
    archetype: "Лофт",
    icon: Building2,
    accent: "slate",
    floors: 2,
    material: "frame",
    residenceType: "primary",
    sizeMin: 90,
    sizeMax: 130,
    defaultSize: 110,
    costPerM2Min: 2_200_000,
    costPerM2Max: 2_800_000,
    tier: "mid",
    features: [
      "Өндөр тааз + антресоль давхар",
      "Каркас тул хурдан босдог",
      "Уян хатан зохион байгуулалт",
    ],
    bestFor: "Орон зайн өндөр мэдрэмж хүсдэг залуу гэр бүл",
    watchOut: "Өндөр эзэлхүүн халаахад дулааны зарцуулалт нэмэгддэг",
  },
  {
    id: "traditional-brick-2",
    name: "Уламжлалт том тоосго 2 давхар",
    tagline: "Том хашаа, агуулах, олон үеийн орон гэр",
    archetype: "Уламжлалт",
    icon: Castle,
    accent: "rose",
    floors: 2,
    material: "brick",
    residenceType: "primary",
    sizeMin: 160,
    sizeMax: 240,
    defaultSize: 200,
    costPerM2Min: 2_800_000,
    costPerM2Max: 3_600_000,
    tier: "premium",
    features: [
      "Том хашаа, гэр ахуйн агуулах",
      "Олон үе амьдрах багтаамж",
      "Бат бөх, удаан эдэлгээтэй",
    ],
    bestFor: "Том гэр бүл, хөдөө/хот захын өргөн газартай эзэд",
    watchOut: "Том талбай нь халаалт, татвар, цэвэрлэгээний зардлыг ихэсгэнэ",
  },
];

export const UNDECIDED_MODEL_ID = "undecided";

/** id-аар загвар олох (undecided бол null) */
export function getHouseModel(id: string | undefined): HouseModel | null {
  if (!id || id === UNDECIDED_MODEL_ID) return null;
  return HOUSE_MODELS.find((m) => m.id === id) ?? null;
}

/** Загварын төсвийн муж (₮) — талбай × м²-ийн өртгийн муж */
export function modelBudgetRange(m: HouseModel): { min: number; max: number } {
  return {
    min: m.sizeMin * m.costPerM2Min,
    max: m.sizeMax * m.costPerM2Max,
  };
}
