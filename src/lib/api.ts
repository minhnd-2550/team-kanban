import { NextResponse } from 'next/server'
import type { ApiResponse, ApiMeta } from '@/types'

// ─── Success response helper ─────────────────────────────────────────────────
export function apiResponse<T>(
  data: T,
  meta: ApiMeta | null = null,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null, meta }, { status })
}

// ─── Error response helper ────────────────────────────────────────────────────
export function apiError(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ data: null, error: { code, message }, meta: null }, { status })
}

// ─── Common error codes ───────────────────────────────────────────────────────
export const ApiErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  CONFIRMATION_REQUIRED: 'CONFIRMATION_REQUIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]

// ─── Auth guard helper ────────────────────────────────────────────────────────
// Usage in Route Handlers:
//   const { user, errorResponse } = await requireAuth(supabase)
//   if (errorResponse) return errorResponse
export async function requireAuth(supabase: { auth: { getUser(): Promise<{ data: { user: { id: string } | null } }> } }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, errorResponse: apiError(ApiErrorCode.UNAUTHORIZED, 'Authentication required', 401) }
  }
  return { user: user as { id: string }, errorResponse: null }
}
