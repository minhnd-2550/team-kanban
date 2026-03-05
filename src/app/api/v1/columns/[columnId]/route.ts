import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { UpdateColumnSchema } from '@/lib/validators/columnSchemas'

// PATCH /api/v1/columns/[columnId] — rename column
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> },
) {
  const { columnId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = UpdateColumnSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  // Get column + verify membership
  const { data: column } = await supabase
    .from('columns')
    .select('id, board_id')
    .eq('id', columnId)
    .maybeSingle()

  if (!column) return apiError(ApiErrorCode.NOT_FOUND, 'Column not found', 404)

  const { data: membership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', column.board_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  const { data: updated, error } = await supabase
    .from('columns')
    .update({ name: parsed.data.name })
    .eq('id', columnId)
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(updated)
}

// DELETE /api/v1/columns/[columnId]?confirm=true
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> },
) {
  const { columnId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const confirm = new URL(request.url).searchParams.get('confirm')
  if (confirm !== 'true') {
    return apiError(ApiErrorCode.CONFIRMATION_REQUIRED, 'Pass ?confirm=true to delete a column', 400)
  }

  // Get column + verify owner
  const { data: column } = await supabase
    .from('columns')
    .select('id, board_id')
    .eq('id', columnId)
    .maybeSingle()

  if (!column) return apiError(ApiErrorCode.NOT_FOUND, 'Column not found', 404)

  const { data: board } = await supabase
    .from('boards')
    .select('owner_id')
    .eq('id', column.board_id)
    .maybeSingle()

  if (!board || board.owner_id !== user.id) {
    return apiError(ApiErrorCode.FORBIDDEN, 'Only the board owner can delete columns', 403)
  }

  const { error } = await supabase.from('columns').delete().eq('id', columnId)
  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse({ deleted: true })
}
