import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { CreateBoardSchema } from '@/lib/validators/boardSchemas'

// GET /api/v1/boards — list boards where the user is a member
export async function GET(_request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const auth = await requireAuth(supabase)
  if (auth.errorResponse) return auth.errorResponse

  const { data, error } = await supabase
    .from('boards')
    .select(`
      id, name, owner_id, created_at, updated_at,
      board_members!inner(user_id)
    `)
    .eq('board_members.user_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(data)
}

// POST /api/v1/boards — create a new board + seed 3 default columns
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const auth = await requireAuth(supabase)
  if (auth.errorResponse) return auth.errorResponse

  const body = await request.json()
  const parsed = CreateBoardSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  const { name } = parsed.data

  // Use SECURITY DEFINER RPC to bypass RLS chicken-and-egg
  // (boards INSERT requires auth.uid()=owner_id, board_members INSERT requires is_board_owner)
  const { data: board, error: boardError } = await supabase
    .rpc('create_board', { p_name: name })

  if (boardError || !board) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, boardError?.message ?? 'Failed to create board', 500)
  }

  // Seed 3 default columns — owner is now in board_members so is_board_member() passes
  const { error: colError } = await supabase.from('columns').insert([
    { board_id: board.id, name: 'To Do', position: 0 },
    { board_id: board.id, name: 'In Progress', position: 1 },
    { board_id: board.id, name: 'Done', position: 2 },
  ])

  if (colError) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, colError.message, 500)
  }

  return apiResponse(board, null, 201)
}
