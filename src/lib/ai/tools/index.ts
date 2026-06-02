import type { ToolSchema } from '../types'
import { getBuildingInfo, type BuildingInfoInput } from './get-building-info'
import {
  calculateMaterialNeeds,
  type CalcMaterialsInput,
} from './calculate-material-needs'
import { estimate, validateInput } from '@/lib/estimator'

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'get_building_info',
    description:
      'Supabase READ-ONLY: project / norm (БНбД) / guide (мэдлэгийн сан) / roadmap / checklist уншина. Хариу нь "found" талбартай — false бол өгөгдөл олдсонгүй.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['project', 'norm', 'guide', 'roadmap', 'checklist'],
          description:
            'project=хэрэглэгчийн төсөл, norm=БНбД заалт, guide=БОСГО-ийн мэдлэгийн сангийн гарын авлага (газар, суурь, материал, төсөв, улирал г.м.), roadmap=алхамууд, checklist=шалгах жагсаалт',
        },
        query: {
          type: 'string',
          description: 'Хайлтын текст (norm болон guide-д ашиглана)',
        },
        project_id: {
          type: 'string',
          description: 'project/roadmap/checklist-ийн ID',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'calculate_material_needs',
    description:
      'Талбай (м²) ба ханын материал (тоосго/блок/каркас/бетон)-аар орцыг бодно. Pure математик функц.',
    parameters: {
      type: 'object',
      properties: {
        area_m2: {
          type: 'number',
          description: 'Байшингийн талбай (м²). Жишээ: 8x10 = 80.',
        },
        material: {
          type: 'string',
          enum: ['brick', 'block', 'frame', 'concrete'],
          description: 'brick=тоосго, block=блок, frame=каркас, concrete=бетон',
        },
        height_m: {
          type: 'number',
          description: 'Ханын өндөр (м). Default 2.7. Хязгаар: 1.8–6.',
        },
        wall_thickness_cm: {
          type: 'number',
          description: 'Ханын зузаан (см). Default 25. Хязгаар: 10–80.',
        },
        floors: {
          type: 'integer',
          description: 'Давхрын тоо. Default 1. Хязгаар: 1–5.',
        },
      },
      required: ['area_m2', 'material'],
    },
  },
  {
    name: 'estimate_house',
    description:
      'Бүхэл байшингийн нийт ҮНЭ ба ХУГАЦАА-ны урьдчилсан тооцоо. Хэрэглэгч "хэдэн төгрөг", "хэдэн сая", "хэдэн сар", "хэр зэрэг үнэтэй" гэх мэт асуувал ЗААВАЛ ашиглана. Бие даан тоо БҮҮ бод. Хариу нь price_total, duration_months, materials_top5, margins агуулна.',
    parameters: {
      type: 'object',
      properties: {
        size_m2: {
          type: 'number',
          description: 'Байшингийн нийт талбай (м²). Хязгаар: 20–2000.',
        },
        floors: {
          type: 'integer',
          description: 'Давхрын тоо: 1, 2 эсвэл 3.',
        },
        location: {
          type: 'string',
          enum: ['city', 'rural'],
          description: 'УБ/хот → city, аймаг/хөдөө → rural.',
        },
        quality: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description:
            'хямд/энгийн → low, дунд/ердийн → medium, өндөр/тансаг → high. Тодорхойгүй бол medium.',
        },
        type: {
          type: 'string',
          enum: ['frame', 'block', 'concrete'],
          description:
            'карказ/мод/SIP → frame, блок/тоосго → block, цутгамал/бетон → concrete.',
        },
      },
      required: ['size_m2', 'floors', 'location', 'quality', 'type'],
    },
  },
]

export async function runTool(name: string, input: unknown): Promise<unknown> {
  if (name === 'get_building_info') {
    return await getBuildingInfo(input as BuildingInfoInput)
  }
  if (name === 'calculate_material_needs') {
    return calculateMaterialNeeds(input as CalcMaterialsInput)
  }
  if (name === 'estimate_house') {
    const v = validateInput(input)
    if (!v.ok) return { ok: false, error: v.error, field: v.field }
    return estimate(v.value)
  }
  throw new Error(`Unknown tool: ${name}`)
}
