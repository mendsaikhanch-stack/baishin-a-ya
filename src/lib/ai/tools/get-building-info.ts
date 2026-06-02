import { createClient } from '@/lib/supabase-server'

export type BuildingInfoInput = {
  type: 'project' | 'norm' | 'roadmap' | 'checklist' | 'guide'
  query?: string
  project_id?: string
}

export type BuildingInfoResult =
  | { found: false; reason: string }
  | { found: true; data: unknown }

export async function getBuildingInfo(
  input: BuildingInfoInput,
): Promise<BuildingInfoResult> {
  const supabase = await createClient()

  switch (input.type) {
    case 'project': {
      if (!input.project_id) {
        return { found: false, reason: 'project_id шаардлагатай' }
      }
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, questionnaire, status, created_at')
        .eq('id', input.project_id)
        .maybeSingle()
      if (error) return { found: false, reason: error.message }
      if (!data) return { found: false, reason: 'Төсөл олдсонгүй' }
      return { found: true, data }
    }

    case 'norm': {
      const query = (input.query ?? '').trim()
      if (!query) {
        return { found: false, reason: 'norm-д query шаардлагатай' }
      }
      const safe = query.replace(/[%_\\]/g, (m) => '\\' + m)
      const { data, error } = await supabase
        .from('content_articles')
        .select('title, summary, content, category, slug')
        .eq('category', 'norm')
        .eq('published', true)
        .ilike('content', `%${safe}%`)
        .limit(5)
      if (error) return { found: false, reason: error.message }
      if (!data || data.length === 0) {
        return { found: false, reason: 'Дотоод санд тохирох БНбД олдсонгүй' }
      }
      return { found: true, data }
    }

    case 'guide': {
      const query = (input.query ?? '').trim()
      if (!query) {
        return { found: false, reason: 'guide-д query шаардлагатай' }
      }
      const safe = query.replace(/[%_\\]/g, (m) => '\\' + m)
      const pattern = `%${safe}%`
      const { data, error } = await supabase
        .from('content_articles')
        .select('title, summary, content, slug')
        .eq('category', 'guide')
        .eq('published', true)
        .or(
          `title.ilike.${pattern},summary.ilike.${pattern},content.ilike.${pattern}`,
        )
        .limit(3)
      if (error) return { found: false, reason: error.message }
      if (!data || data.length === 0) {
        return { found: false, reason: 'Мэдлэгийн сангаас тохирох нийтлэл олдсонгүй' }
      }
      return { found: true, data }
    }

    case 'roadmap': {
      if (!input.project_id) {
        return { found: false, reason: 'project_id шаардлагатай' }
      }
      const { data, error } = await supabase
        .from('roadmap_steps')
        .select(
          'phase_number, title, description, status, expert_needed, expert_type, order_index',
        )
        .eq('project_id', input.project_id)
        .order('order_index', { ascending: true })
      if (error) return { found: false, reason: error.message }
      if (!data || data.length === 0) {
        return { found: false, reason: 'Roadmap step олдсонгүй' }
      }
      return { found: true, data }
    }

    case 'checklist': {
      if (!input.project_id) {
        return { found: false, reason: 'project_id шаардлагатай' }
      }
      const { data, error } = await supabase
        .from('checklist_items')
        .select('phase, category, title, description, completed, order_index')
        .eq('project_id', input.project_id)
        .order('order_index', { ascending: true })
      if (error) return { found: false, reason: error.message }
      if (!data || data.length === 0) {
        return { found: false, reason: 'Checklist олдсонгүй' }
      }
      return { found: true, data }
    }
  }
}
