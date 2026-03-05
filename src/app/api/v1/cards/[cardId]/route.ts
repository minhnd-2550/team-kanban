import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { UpdateCardSchema } from '@/lib/validators/cardSchemas'

// GET /api/v1/cards/[cardId] — card detail + comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const { data: card, error } = await supabase
    .from('cards')
    .select(`
      id, column_id, board_id, title, description, assignee_id, position, created_by, created_at, updated_at,
      assignee:assignee_id(id, display_name, avatar_url),
      comments(id, card_id, author_id, body, created_at,
        author:author_id(id, display_name, avatar_url)
      )
    `)
    .eq('id', cardId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return apiError(ApiErrorCode.NOT_FOUND, 'Card not found', 404)
    return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)
  }

  // Check membership via board_id
  const { data: membership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', card.board_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  return apiResponse(card)
}

// PATCH /api/v1/cards/[cardId] — update title / description
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = UpdateCardSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { data: card } = await supabase
    .from('cards')
    .select('board_id, created_by')
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

  const { data: updated, error } = await supabase
    .from('cards')
    .update(parsed.data)
    .eq('id', cardId)
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(updated)
}

// DELETE /api/v1/cards/[cardId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const { data: card } = await supabase
    .from('cards')
    .select('board_id, created_by')
    .eq('id', cardId)
    .maybeSingle()

  if (!card) return apiError(ApiErrorCode.NOT_FOUND, 'Card not found', 404)

  const { data: board } = await supabase
    .from('boards')
    .select('owner_id')
    .eq('id', card.board_id)
    .maybeSingle()

  const isCreator = card.created_by === user.id
  const isOwner = board?.owner_id === user.id

  if (!isCreator && !isOwner) {
    return apiError(ApiErrorCode.FORBIDDEN, 'Only the card creator or board owner can delete cards', 403)
  }

  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse({ deleted: true })
}
