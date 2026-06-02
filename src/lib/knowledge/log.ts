import 'server-only'
import { getAdminClient } from '@/lib/supabase-admin'

/**
 * Best-effort logging of a user chat question for the knowledge-enrichment loop.
 * NEVER throws and NEVER blocks the chat response — any failure (missing table,
 * missing service key, network) is swallowed. Stores the question text only,
 * no PII (no IP / name / email).
 */
export function logChatQuestion(
  question: string,
  hadContext: boolean,
): void {
  const text = (question || '').trim()
  if (!text) return

  // Fire-and-forget: do not await in the request path.
  void (async () => {
    try {
      const supabase = getAdminClient()
      if (!supabase) return
      await supabase.from('chat_questions').insert({
        question: text.slice(0, 2000),
        char_len: text.length,
        had_context: hadContext,
      })
    } catch {
      // Intentionally ignored — logging must never affect the user.
    }
  })()
}
