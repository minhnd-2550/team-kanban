import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { MoveCardSchema } from '@/lib/validators/cardSchemas'

// PATCH /api/v1/cards/[cardId]/move — move card to new column + position
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = MoveCardSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { columnId: targetColumnId, position: targetPosition } = parsed.data

  // Fetch card for board membership check
  const { data: card } = await supabase
    .from('cards')
    .select('board_id, column_id, position')
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

  const isSameColumn = card.column_id === targetColumnId

  if (isSameColumn) {
    // Reorder within column: shift siblings between old and new position
    const min = Math.min(card.position, targetPosition)
    const max = Math.max(card.position, targetPosition)
    const direction = targetPosition < card.position ? 1 : -1

    const { data: siblings } = await supabase
      .from('cards')
      .select('id, position')
      .eq('column_id', targetColumnId)
      .neq('id', cardId)
      .gte('position', min)
      .lte('position', max)

    if (siblings) {
      for (const sibling of siblings) {
        await supabase
          .from('cards')
          .update({ position: sibling.position + direction })
          .eq('id', sibling.id)
      }
    }
  } else {
    // Moving to a different column: shift up siblings in source column above old position
    const { data: sourceCards } = await supabase
      .from('cards')
      .select('id, position')
      .eq('column_id', card.column_id)
      .gt('position', card.position)

    if (sourceCards) {
      for (const c of sourceCards) {
        await supabase.from('cards').update({ position: c.position - 1 }).eq('id', c.id)
      }
    }

    // Shift down siblings in target column at or after target position
    const { data: targetCards } = await supabase
      .from('cards')
      .select('id, position')
      .eq('column_id', targetColumnId)
      .gte('position', targetPosition)

    if (targetCards) {
      for (const c of targetCards) {
        await supabase.from('cards').update({ position: c.position + 1 }).eq('id', c.id)
      }
    }
  }

  // Move the card itself
  const { data: updated, error } = await supabase
    .from('cards')
    .update({ column_id: targetColumnId, position: targetPosition })
    .eq('id', cardId)
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(updated)
}
