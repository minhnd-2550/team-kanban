import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { CreateCardSchema } from '@/lib/validators/cardSchemas'

// POST /api/v1/cards — create a new card
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = CreateCardSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { columnId, boardId, title, description } = parsed.data

  // Verify membership
  const { data: membership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  // Get max position in column
  const { data: last } = await supabase
    .from('cards')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = last ? last.position + 1 : 0

  const { data: card, error } = await supabase
    .from('cards')
    .insert({
      column_id: columnId,
      board_id: boardId,
      title,
      description: description ?? null,
      assignee_id: null,
      position,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(card, null, 201)
}
