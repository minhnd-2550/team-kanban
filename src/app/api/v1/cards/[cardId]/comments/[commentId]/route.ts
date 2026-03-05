import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'

// DELETE /api/v1/cards/[cardId]/comments/[commentId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string; commentId: string }> },
) {
  const { cardId, commentId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id, board_id')
    .eq('id', commentId)
    .eq('card_id', cardId)
    .maybeSingle()

  if (!comment) return apiError(ApiErrorCode.NOT_FOUND, 'Comment not found', 404)

  const isAuthor = comment.author_id === user.id
  const { data: board } = await supabase
    .from('boards')
    .select('owner_id')
    .eq('id', comment.board_id)
    .maybeSingle()
  const isOwner = board?.owner_id === user.id

  if (!isAuthor && !isOwner) {
    return apiError(ApiErrorCode.FORBIDDEN, 'You can only delete your own comments', 403)
  }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse({ deleted: true })
}
