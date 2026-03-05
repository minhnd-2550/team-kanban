import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { CreateCommentSchema } from '@/lib/validators/commentSchemas'

// POST /api/v1/cards/[cardId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = CreateCommentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { data: card } = await supabase
    .from('cards')
    .select('board_id')
    .eq('id', cardId)
    .maybeSingle()

  if (!card) return apiError(ApiErrorCode.NOT_FOUND, 'Card not found', 404)

  const { data: membership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', card.board_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ card_id: cardId, board_id: card.board_id, author_id: user.id, body: parsed.data.body })
    .select(`
      id, card_id, board_id, author_id, body, created_at,
      author:author_id(id, display_name, avatar_url)
    `)
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(comment, null, 201)
}
