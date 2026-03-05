import { describe, it, expect, vi } from 'vitest'
import { requireAuth, ApiErrorCode } from '@/lib/api'

describe('api requireAuth', () => {
  it('returns errorResponse when no user', async () => {
    const supabase = { auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } } as any

    const { user, errorResponse } = await requireAuth(supabase)
    expect(user).toBeNull()
    expect(errorResponse).not.toBeNull()
    // errorResponse is a NextResponse; check by reading status via toString or ok
    // convert to JSON by calling json()
    // but NextResponse in this environment exposes status
    // ensure API error code in body
    const body: any = await (errorResponse as any).json()
    expect(body.error.code).toBe(ApiErrorCode.UNAUTHORIZED)
  })

  it('returns user when present', async () => {
    const supabase = { auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) } } as any

    const { user, errorResponse } = await requireAuth(supabase)
    expect(errorResponse).toBeNull()
    expect(user).toEqual({ id: 'u1' })
  })
})
