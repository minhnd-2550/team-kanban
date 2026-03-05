import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, requireAuth, ApiErrorCode } from '@/lib/api'
import { AddBoardMemberSchema } from '@/lib/validators/boardSchemas'

// GET /api/v1/boards/[boardId]/members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  // Verify user is a member
  const { data: membership } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return apiError(ApiErrorCode.FORBIDDEN, 'Access denied', 403)

  const { data, error } = await supabase
    .from('board_members')
    .select(`
      id, board_id, user_id, role, joined_at,
      profiles:user_id(id, display_name, email, avatar_url)
    `)
    .eq('board_id', boardId)
    .order('joined_at', { ascending: true })

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)
  return apiResponse(data)
}

// POST /api/v1/boards/[boardId]/members — invite member by email (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const { user, errorResponse } = await requireAuth(supabase)
  if (errorResponse) return errorResponse

  // Must be owner
  const { data: board } = await supabase
    .from('boards')
    .select('id, owner_id')
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!board) return apiError(ApiErrorCode.FORBIDDEN, 'Only the board owner can invite members', 403)

  const body = await request.json()
  const parsed = AddBoardMemberSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ApiErrorCode.VALIDATION_ERROR, parsed.error.issues[0].message)
  }

  // Look up the invited user's profile by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle()

  if (!profile) {
    return apiError(ApiErrorCode.NOT_FOUND, 'No user found with that email', 404)
  }

  // Check for duplicate membership
  const { data: existing } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) {
    return apiError(ApiErrorCode.CONFLICT, 'User is already a board member', 409)
  }

  const { data: member, error } = await supabase
    .from('board_members')
    .insert({ board_id: boardId, user_id: profile.id, role: 'member' })
    .select()
    .single()

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message, 500)

  return apiResponse(member, null, 201)
}
