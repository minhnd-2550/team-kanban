import { vi, describe, it, expect } from 'vitest'

vi.mock('@supabase/ssr', () => ({ createBrowserClient: vi.fn(() => ({ browser: true })) }))

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

describe('supabase client', () => {
  it('returns singleton browser client', () => {
    const a = getSupabaseBrowserClient()
    const b = getSupabaseBrowserClient()
    expect(a).toBe(b)
    expect((a as any).browser).toBe(true)
  })
})
