import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'

// DELETE /api/v1/boards/[boardId]/members/[userId] — remove member (owner only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string; userId: string }> },
) {
  const { boardId, userId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  // Must be owner (or removing yourself)
  const { data: board } = await supabase
    .from('boards')
    .select('id, owner_id')
    .eq('id', boardId)
    .maybeSingle()

  if (!board) return apiError(ApiErrorCode.NOT_FOUND, 'Board not found', 404)

  const isOwner = board.owner_id === user.id
  const isSelf = userId === user.id

  if (!isOwner && !isSelf) {
    return apiError(ApiErrorCode.FORBIDDEN, 'Only the board owner can remove members', 403)
  }

  // Can't remove the owner
  if (userId === board.owner_id && !isSelf) {
    return apiError(ApiErrorCode.FORBIDDEN, 'Cannot remove the board owner', 403)
  }

  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId)

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse({ removed: true })
}
