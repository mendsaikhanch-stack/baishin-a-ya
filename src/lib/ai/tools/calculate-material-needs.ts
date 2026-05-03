export type MaterialType = 'brick' | 'block' | 'frame' | 'concrete'

export type CalcMaterialsInput = {
  area_m2: number
  material: MaterialType
  height_m?: number
  wall_thickness_cm?: number
  floors?: number
}

export type CalcMaterialsSuccess = {
  ok: true
  inputs: {
    area_m2: number
    height_m: number
    wall_thickness_cm: number
    floors: number
    material: MaterialType
  }
  perimeter_m: number
  wall_area_m2: number
  wall_volume_m3: number
  materials: Record<string, number>
  notes: string[]
  disclaimer: string
}

export type CalcMaterialsError = {
  ok: false
  error: string
  field?: string
}

export type CalcMaterialsResult = CalcMaterialsSuccess | CalcMaterialsError

const VALID_MATERIALS: MaterialType[] = ['brick', 'block', 'frame', 'concrete']

const DISCLAIMER =
  'Энэ бол урьдчилсан төлөвлөлтийн тооцоо. Албан зураг төсөл, даац, хийц бүтээц, БНбД-ийн баталгаатай тооцоог мэргэжлийн инженерээр баталгаажуулна.'

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d

function validate(input: CalcMaterialsInput): CalcMaterialsError | null {
  if (typeof input.area_m2 !== 'number' || !Number.isFinite(input.area_m2)) {
    return { ok: false, error: 'area_m2 нь тоон утга байх ёстой.', field: 'area_m2' }
  }
  if (input.area_m2 <= 0 || input.area_m2 > 5000) {
    return {
      ok: false,
      error: 'area_m2 нь 0–5000 м² хооронд байх ёстой.',
      field: 'area_m2',
    }
  }
  if (!VALID_MATERIALS.includes(input.material)) {
    return {
      ok: false,
      error: `material нь ${VALID_MATERIALS.join(', ')}-ийн нэг байх ёстой.`,
      field: 'material',
    }
  }
  if (input.height_m !== undefined) {
    if (
      typeof input.height_m !== 'number' ||
      !Number.isFinite(input.height_m) ||
      input.height_m < 1.8 ||
      input.height_m > 6
    ) {
      return {
        ok: false,
        error: 'height_m нь 1.8–6 м хооронд байх ёстой.',
        field: 'height_m',
      }
    }
  }
  if (input.wall_thickness_cm !== undefined) {
    if (
      typeof input.wall_thickness_cm !== 'number' ||
      !Number.isFinite(input.wall_thickness_cm) ||
      input.wall_thickness_cm < 10 ||
      input.wall_thickness_cm > 80
    ) {
      return {
        ok: false,
        error: 'wall_thickness_cm нь 10–80 см хооронд байх ёстой.',
        field: 'wall_thickness_cm',
      }
    }
  }
  if (input.floors !== undefined) {
    if (
      typeof input.floors !== 'number' ||
      !Number.isInteger(input.floors) ||
      input.floors < 1 ||
      input.floors > 5
    ) {
      return {
        ok: false,
        error: 'floors нь 1–5 хооронд бүхэл тоо байх ёстой.',
        field: 'floors',
      }
    }
  }
  return null
}

export function calculateMaterialNeeds(
  input: CalcMaterialsInput,
): CalcMaterialsResult {
  const validationError = validate(input)
  if (validationError) return validationError

  const height = input.height_m ?? 2.7
  const wallThicknessCm = input.wall_thickness_cm ?? 25
  const wallThicknessM = wallThicknessCm / 100
  const floors = input.floors ?? 1

  const perimeter = round(Math.sqrt(input.area_m2) * 4, 1)
  const wallArea = round(perimeter * height * floors, 1)
  const wallVolume = round(wallArea * wallThicknessM, 2)

  const notes = [
    'Хаалга/цонхны зайг нийт ханаас ~10–15% хасч тооцох ёстой.',
    'Орцыг бүсчилсэн уур амьсгал, барилгын төрлөөс хамаарч 5–15% нэмэгдүүлж нөөцлөнө.',
  ]

  let materials: Record<string, number>

  switch (input.material) {
    case 'brick': {
      const mortarVol = round(wallVolume * 0.25)
      materials = {
        bricks_count: Math.ceil(wallVolume * 400),
        mortar_m3: mortarVol,
        cement_kg: round(mortarVol * 350),
        cement_tons: round(mortarVol * 0.35, 2),
        sand_m3: round(mortarVol * 1.0),
      }
      break
    }
    case 'block': {
      const mortarVol = round(wallVolume * 0.15)
      materials = {
        blocks_count: Math.ceil(wallVolume * 62),
        mortar_m3: mortarVol,
        cement_kg: round(mortarVol * 350),
        cement_tons: round(mortarVol * 0.35, 2),
        sand_m3: round(mortarVol * 1.0),
      }
      break
    }
    case 'concrete': {
      materials = {
        concrete_m3: wallVolume,
        cement_kg: round(wallVolume * 350),
        cement_tons: round(wallVolume * 0.35, 2),
        sand_m3: round(wallVolume * 0.5),
        gravel_m3: round(wallVolume * 0.8),
      }
      break
    }
    case 'frame': {
      materials = {
        wall_area_m2: wallArea,
        wood_m3: round(wallArea * 0.04),
        insulation_m3: round(wallArea * 0.1),
        osb_m2: round(wallArea * 2),
      }
      notes.push(
        'Каркас барилгын тооцоо ялангуяа техникийн зураг дээр нарийн хийгдэнэ.',
      )
      break
    }
  }

  return {
    ok: true,
    inputs: {
      area_m2: input.area_m2,
      height_m: height,
      wall_thickness_cm: wallThicknessCm,
      floors,
      material: input.material,
    },
    perimeter_m: perimeter,
    wall_area_m2: wallArea,
    wall_volume_m3: wallVolume,
    materials,
    notes,
    disclaimer: DISCLAIMER,
  }
}
