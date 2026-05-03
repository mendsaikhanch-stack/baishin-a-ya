import type { ToolSchema } from '../types'
import { getBuildingInfo, type BuildingInfoInput } from './get-building-info'
import {
  calculateMaterialNeeds,
  type CalcMaterialsInput,
} from './calculate-material-needs'

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'get_building_info',
    description:
      'Supabase READ-ONLY: project / norm (БНбД) / roadmap / checklist уншина. Хариу нь "found" талбартай — false бол өгөгдөл олдсонгүй.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['project', 'norm', 'roadmap', 'checklist'],
          description:
            'project=хэрэглэгчийн төсөл, norm=БНбД заалт, roadmap=алхамууд, checklist=шалгах жагсаалт',
        },
        query: {
          type: 'string',
          description: 'Хайлтын текст (norm-д ашиглана)',
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
]

export async function runTool(name: string, input: unknown): Promise<unknown> {
  if (name === 'get_building_info') {
    return await getBuildingInfo(input as BuildingInfoInput)
  }
  if (name === 'calculate_material_needs') {
    return calculateMaterialNeeds(input as CalcMaterialsInput)
  }
  throw new Error(`Unknown tool: ${name}`)
}
