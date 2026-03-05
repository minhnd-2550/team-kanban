import { getSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth, apiError, apiResponse } from '@/lib/api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const { boardId } = await params
  const { searchParams } = new URL(request.url)
  const before = searchParams.get('before')

  // Verify board membership
  const { data: member } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return apiError('FORBIDDEN', 'Not a board member', 403)
  }

  let query = supabase
    .from('activity_events')
    .select(`
      id,
      event_type,
      card_id,
      card_title_snapshot,
      from_column_name,
      to_column_name,
      created_at,
      actor:profiles!actor_id(id, display_name, avatar_url)
    `)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    return apiError('INTERNAL_ERROR', error.message, 500)
  }

  const events = (data ?? []).map((e) => ({
    id: e.id,
    eventType: e.event_type,
    cardId: e.card_id,
    cardTitle: e.card_title_snapshot,
    fromColumn: e.from_column_name,
    toColumn: e.to_column_name,
    createdAt: e.created_at,
    actor: e.actor,
  }))

  const nextCursor =
    events.length === 50 ? events[events.length - 1].createdAt : null

  return apiResponse({ events, nextCursor })
}
