import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type Body = {
  action?: 'publish' | 'reject' | 'edit'
  title?: string
  summary?: string
  content?: string
  subcategory?: string
}

/**
 * Admin review action on a draft article (the human verification gate).
 *  - publish: category='guide_draft' → 'guide', published=true (goes live).
 *  - reject:  delete the draft.
 *  - edit:    update fields (title/summary/content/subcategory) before publishing.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.reason }, { status: admin.status })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const id = params.id

  if (body.action === 'reject') {
    const { error } = await supabase
      .from('content_articles')
      .delete()
      .eq('id', id)
      .eq('category', 'guide_draft')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'reject' })
  }

  if (body.action === 'edit') {
    const patch: Record<string, unknown> = {}
    if (typeof body.title === 'string') patch.title = body.title.trim()
    if (typeof body.summary === 'string') patch.summary = body.summary.trim()
    if (typeof body.content === 'string') patch.content = body.content
    if (typeof body.subcategory === 'string') patch.subcategory = body.subcategory
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'no_fields' }, { status: 400 })
    }
    const { error } = await supabase
      .from('content_articles')
      .update(patch)
      .eq('id', id)
      .eq('category', 'guide_draft')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'edit' })
  }

  if (body.action === 'publish') {
    const { error } = await supabase
      .from('content_articles')
      .update({ category: 'guide', published: true })
      .eq('id', id)
      .eq('category', 'guide_draft')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Push the newly approved article live immediately (no 5-min ISR wait).
    revalidatePath('/knowledge')
    revalidatePath('/knowledge/[slug]', 'page')
    return NextResponse.json({ ok: true, action: 'publish' })
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
}
