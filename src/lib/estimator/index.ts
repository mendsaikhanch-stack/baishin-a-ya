import {
  PRICE_TABLE,
  FLOOR_MULTIPLIER,
  LOCATION_MULTIPLIER,
  SEASON_MULTIPLIER,
  DURATION_TABLE,
  MATERIAL_TABLE,
  RANGE_PCT,
  DEFAULT_MARGINS,
  HOUSE_TYPES,
  QUALITIES,
  LOCATIONS,
  FLOORS,
  SEASONS,
  currentSeason,
} from './data'
import type {
  EstimateInput,
  EstimateOutput,
  Floors,
  HouseType,
  Location,
  Quality,
  Range,
  Season,
  MaterialEstimate,
  MarginBreakdown,
  Margins,
} from './types'

export type {
  EstimateInput,
  EstimateOutput,
  MaterialEstimate,
  Range,
  Season,
  Margins,
  MarginBreakdown,
} from './types'

const round = (n: number) => Math.round(n)

export type ValidationResult =
  | { ok: true; value: EstimateInput }
  | { ok: false; error: string; field?: string }

export function validateInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Body must be a JSON object.' }
  }
  const r = raw as Record<string, unknown>

  const size_m2 = r.size_m2
  if (typeof size_m2 !== 'number' || !Number.isFinite(size_m2)) {
    return { ok: false, error: 'size_m2 must be a number.', field: 'size_m2' }
  }
  if (size_m2 < 20 || size_m2 > 2000) {
    return { ok: false, error: 'size_m2 must be 20–2000 m².', field: 'size_m2' }
  }

  const floors = r.floors
  if (!FLOORS.includes(floors as Floors)) {
    return { ok: false, error: 'floors must be 1, 2, or 3.', field: 'floors' }
  }

  const location = r.location
  if (!LOCATIONS.includes(location as Location)) {
    return {
      ok: false,
      error: 'location must be "city" or "rural".',
      field: 'location',
    }
  }

  const quality = r.quality
  if (!QUALITIES.includes(quality as Quality)) {
    return {
      ok: false,
      error: 'quality must be "low", "medium", or "high".',
      field: 'quality',
    }
  }

  const type = r.type
  if (!HOUSE_TYPES.includes(type as HouseType)) {
    return {
      ok: false,
      error: 'type must be "frame", "block", or "concrete".',
      field: 'type',
    }
  }

  let season: Season | undefined
  if (r.season !== undefined) {
    if (!SEASONS.includes(r.season as Season)) {
      return {
        ok: false,
        error: 'season must be "spring", "summer", "autumn", or "winter".',
        field: 'season',
      }
    }
    season = r.season as Season
  }

  let margins: Partial<Margins> | undefined
  if (r.margins !== undefined) {
    if (!r.margins || typeof r.margins !== 'object') {
      return { ok: false, error: 'margins must be an object.', field: 'margins' }
    }
    const m = r.margins as Record<string, unknown>
    const partial: Partial<Margins> = {}
    for (const key of ['profit_pct', 'contingency_pct', 'vat_pct'] as const) {
      const v = m[key]
      if (v === undefined) continue
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) {
        return {
          ok: false,
          error: `margins.${key} must be a number between 0 and 1.`,
          field: `margins.${key}`,
        }
      }
      partial[key] = v
    }
    margins = partial
  }

  return {
    ok: true,
    value: {
      size_m2,
      floors: floors as Floors,
      location: location as Location,
      quality: quality as Quality,
      type: type as HouseType,
      ...(season ? { season } : {}),
      ...(margins ? { margins } : {}),
    },
  }
}

function applyMargins(base: Range, override?: Partial<Margins>): MarginBreakdown {
  const applied: Margins = { ...DEFAULT_MARGINS, ...override }

  const profit: Range = {
    min: round(base.min * applied.profit_pct),
    max: round(base.max * applied.profit_pct),
  }
  const subtotal1Min = base.min + profit.min
  const subtotal1Max = base.max + profit.max

  const contingency: Range = {
    min: round(subtotal1Min * applied.contingency_pct),
    max: round(subtotal1Max * applied.contingency_pct),
  }
  const subtotal2Min = subtotal1Min + contingency.min
  const subtotal2Max = subtotal1Max + contingency.max

  const vat: Range = {
    min: round(subtotal2Min * applied.vat_pct),
    max: round(subtotal2Max * applied.vat_pct),
  }
  const final: Range = {
    min: subtotal2Min + vat.min,
    max: subtotal2Max + vat.max,
  }

  return { base, profit, contingency, vat, final, applied }
}

export function estimate(input: EstimateInput): EstimateOutput {
  const season: Season = input.season ?? currentSeason()
  const seasonMul = SEASON_MULTIPLIER[input.type][season]
  const base = PRICE_TABLE[input.type][input.quality]
  const center =
    base *
    FLOOR_MULTIPLIER[input.floors] *
    LOCATION_MULTIPLIER[input.location] *
    seasonMul
  const minPerM2 = center * (1 - RANGE_PCT)
  const maxPerM2 = center * (1 + RANGE_PCT)

  const minTotal = minPerM2 * input.size_m2
  const maxTotal = maxPerM2 * input.size_m2
  const baseTotal: Range = { min: round(minTotal), max: round(maxTotal) }

  const margins = applyMargins(baseTotal, input.margins)

  const dur = DURATION_TABLE[input.type]
  const extraFloors = input.floors - 1
  const duration_months: Range = {
    min: dur.base[0] + extraFloors * dur.perExtraFloor[0],
    max: dur.base[1] + extraFloors * dur.perExtraFloor[1],
  }

  const materials_top5: MaterialEstimate[] = MATERIAL_TABLE[input.type].map((m) => ({
    name: m.name,
    share: m.share,
    cost: { min: round(minTotal * m.share), max: round(maxTotal * m.share) },
  }))

  return {
    input,
    price_per_m2: { min: round(minPerM2), max: round(maxPerM2) },
    price_total: baseTotal,
    price_total_with_margin: margins.final,
    margins,
    season_applied: { season, multiplier: seasonMul },
    duration_months,
    materials_top5,
    currency: 'MNT',
    computed_at: new Date().toISOString(),
  }
}
