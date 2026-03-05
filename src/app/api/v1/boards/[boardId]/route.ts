import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { UpdateBoardSchema } from '@/lib/validators/boardSchemas'

// GET /api/v1/boards/[boardId] — full board detail with columns, cards, and members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  // Verify membership via RLS (supabase policy will 403 if not member)
  const { data: board, error } = await supabase
    .from('boards')
    .select(`
      id, name, owner_id, created_at, updated_at,
      board_members(
        id, user_id, role, joined_at,
        profiles(id, display_name, email, avatar_url)
      ),
      columns(
        id, board_id, name, position, created_at,
        cards(id, column_id, board_id, title, description, assignee_id, position, created_by, created_at, updated_at,
          profiles:assignee_id(id, display_name, avatar_url)
        )
      )
    `)
    .eq('id', boardId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return apiError(ApiErrorCode.NOT_FOUND, 'Board not found', 404)
    return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)
  }

  // Check membership
  const boardData = board as unknown as { board_members: { user_id: string }[] }
  const isMember = Array.isArray(boardData.board_members) &&
    boardData.board_members.some((m) => m.user_id === user.id)

  if (!isMember) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  return apiResponse(board)
}

// PATCH /api/v1/boards/[boardId] — rename board (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = UpdateBoardSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { data: board, error } = await supabase
    .from('boards')
    .update({ name: parsed.data.name })
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return apiError(ApiErrorCode.FORBIDDEN, 'Not found or not owner', 403)
    return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)
  }

  return apiResponse(board)
}

// DELETE /api/v1/boards/[boardId] — delete board (owner only, cascades)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
    .eq('owner_id', user.id)

  if (error) {
    return apiError(ApiErrorCode.FORBIDDEN, 'Not found or not owner', 403)
  }

  return apiResponse({ deleted: true })
}
