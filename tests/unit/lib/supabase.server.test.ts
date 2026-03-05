import { vi, describe, it, expect } from 'vitest'

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn(() => ({ server: true })) }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ svc: true })) }))
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })) }))

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase/server'

describe('supabase server', () => {
  it('getSupabaseServerClient returns server client', async () => {
    const c = await getSupabaseServerClient()
    expect((c as any).server).toBe(true)
  })

  it('getSupabaseServiceClient returns service client', () => {
    const s = getSupabaseServiceClient()
    expect((s as any).svc).toBe(true)
  })
})
