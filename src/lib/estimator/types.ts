export type HouseType = 'frame' | 'block' | 'concrete'
export type Quality = 'low' | 'medium' | 'high'
export type Location = 'city' | 'rural'
export type Floors = 1 | 2 | 3
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type Range = { min: number; max: number }

export type Margins = {
  profit_pct: number
  contingency_pct: number
  vat_pct: number
}

export type EstimateInput = {
  size_m2: number
  floors: Floors
  location: Location
  quality: Quality
  type: HouseType
  season?: Season
  margins?: Partial<Margins>
}

export type MarginBreakdown = {
  base: Range
  profit: Range
  contingency: Range
  vat: Range
  final: Range
  applied: Margins
}

export type MaterialEstimate = {
  name: string
  share: number
  cost: Range
}

export type SeasonApplied = { season: Season; multiplier: number }

export type EstimateOutput = {
  input: EstimateInput
  price_per_m2: Range
  price_total: Range
  price_total_with_margin: Range
  margins: MarginBreakdown
  season_applied: SeasonApplied
  duration_months: Range
  materials_top5: MaterialEstimate[]
  currency: 'MNT'
  computed_at: string
}

export type PriceTable = Record<HouseType, Record<Quality, number>>

export type DurationTable = Record<
  HouseType,
  { base: [number, number]; perExtraFloor: [number, number] }
>

export type MaterialEntry = { name: string; share: number }
export type MaterialTable = Record<HouseType, MaterialEntry[]>
