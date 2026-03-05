import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { CreateColumnSchema } from '@/lib/validators/columnSchemas'

// POST /api/v1/columns — create a new column in a board
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  const body = await request.json()
  const parsed = CreateColumnSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { boardId, name } = parsed.data

  // Verify user is a board member
  const { data: membership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  // Find next position
  const { data: existing } = await supabase
    .from('columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = existing ? existing.position + 1 : 0

  const { data: column, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, name, position })
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(column, null, 201)
}
