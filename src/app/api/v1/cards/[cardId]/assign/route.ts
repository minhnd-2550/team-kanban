import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { AssignCardSchema } from '@/lib/validators/cardSchemas'

// PATCH /api/v1/cards/[cardId]/assign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = AssignCardSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { assigneeId } = parsed.data

  const { data: card } = await supabase
    .from('cards')
    .select('board_id')
    .eq('id', cardId)
    .maybeSingle()

  if (!card) return apiError(ApiErrorCode.NOT_FOUND, 'Card not found', 404)

  // Requester must be a board member
  const { data: requesterMembership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', card.board_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!requesterMembership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  // Assignee must be a board member (unless unassigning)
  if (assigneeId !== null) {
    const { data: assigneeMembership } = await supabase
      .from('board_members')
      .select('id')
      .eq('board_id', card.board_id)
      .eq('user_id', assigneeId)
      .maybeSingle()

    if (!assigneeMembership) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, 'Assignee must be a board member')
    }
  }

  const { data: updated, error } = await supabase
    .from('cards')
    .update({ assignee_id: assigneeId })
    .eq('id', cardId)
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(updated)
}
