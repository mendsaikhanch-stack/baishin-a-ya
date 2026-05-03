import type {
  HouseType,
  Quality,
  Floors,
  Location,
  Season,
  PriceTable,
  DurationTable,
  MaterialTable,
} from './types'

export const PRICE_TABLE: PriceTable = {
  frame:    { low: 1_200_000, medium: 1_600_000, high: 2_200_000 },
  block:    { low: 1_500_000, medium: 2_000_000, high: 2_800_000 },
  concrete: { low: 1_800_000, medium: 2_400_000, high: 3_500_000 },
}

export const FLOOR_MULTIPLIER: Record<Floors, number> = {
  1: 1.0,
  2: 1.05,
  3: 1.12,
}

export const LOCATION_MULTIPLIER: Record<Location, number> = {
  city: 1.0,
  rural: 0.9,
}

export const RANGE_PCT = 0.15

// Default margins (Монголын зах зээлд ердийн)
//   profit:      үйлчилгээ үзүүлэгчийн орлого
//   contingency: гэнэтийн зардлын нөөц
//   vat:         НӨАТ (Монголд 10%)
export const DEFAULT_MARGINS = {
  profit_pct: 0.15,
  contingency_pct: 0.10,
  vat_pct: 0.10,
}

// Type × Season → multiplier.
//   frame: SIP/мод өвөлд бага зэрэг хэцүү (+5%)
//   block: өвлийн раствор халаалттай нэмэлт (+10%)
//   concrete: −15°C-аас доош халаалттай добавка ёстой (+20%); намар +5%
export const SEASON_MULTIPLIER: Record<HouseType, Record<Season, number>> = {
  frame:    { spring: 1.0, summer: 1.0, autumn: 1.0,  winter: 1.05 },
  block:    { spring: 1.0, summer: 1.0, autumn: 1.0,  winter: 1.10 },
  concrete: { spring: 1.0, summer: 1.0, autumn: 1.05, winter: 1.20 },
}

export function currentSeason(month: number = new Date().getMonth() + 1): Season {
  if (month >= 3 && month <= 5)  return 'spring'
  if (month >= 6 && month <= 8)  return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export const DURATION_TABLE: DurationTable = {
  frame:    { base: [4, 7],  perExtraFloor: [1, 2] },
  block:    { base: [5, 9],  perExtraFloor: [1, 2] },
  concrete: { base: [7, 12], perExtraFloor: [2, 3] },
}

export const MATERIAL_TABLE: MaterialTable = {
  frame: [
    { name: 'Мод / SIP панель',   share: 0.30 },
    { name: 'Дулаалга',           share: 0.18 },
    { name: 'Суурийн бетон',      share: 0.15 },
    { name: 'Дээвэр',             share: 0.12 },
    { name: 'OSB / гадна',        share: 0.10 },
  ],
  block: [
    { name: 'Блок',    share: 0.32 },
    { name: 'Цемент',  share: 0.18 },
    { name: 'Арматур', share: 0.12 },
    { name: 'Элс',     share: 0.10 },
    { name: 'Дээвэр',  share: 0.10 },
  ],
  concrete: [
    { name: 'Бетон',    share: 0.35 },
    { name: 'Арматур',  share: 0.20 },
    { name: 'Дулаалга', share: 0.12 },
    { name: 'Хашмал',   share: 0.10 },
    { name: 'Дээвэр',   share: 0.08 },
  ],
}

export const HOUSE_TYPES: HouseType[] = ['frame', 'block', 'concrete']
export const QUALITIES: Quality[] = ['low', 'medium', 'high']
export const LOCATIONS: Location[] = ['city', 'rural']
export const FLOORS: Floors[] = [1, 2, 3]
