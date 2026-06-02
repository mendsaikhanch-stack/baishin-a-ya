import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/** Admin: list pending draft articles + recent chat questions for the review gate. */
export async function GET() {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.reason }, { status: admin.status })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'service_unavailable' },
      { status: 503 },
    )
  }

  const [draftsRes, questionsRes, unprocessedRes] = await Promise.all([
    supabase
      .from('content_articles')
      .select('id, slug, subcategory, title, summary, content, created_at')
      .eq('category', 'guide_draft')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('chat_questions')
      .select('id, question, created_at, processed_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('chat_questions')
      .select('id', { count: 'exact', head: true })
      .is('processed_at', null),
  ])

  return NextResponse.json({
    drafts: draftsRes.data ?? [],
    questions: questionsRes.data ?? [],
    unprocessedCount: unprocessedRes.count ?? 0,
    errors: {
      drafts: draftsRes.error?.message ?? null,
      questions: questionsRes.error?.message ?? null,
    },
  })
}
