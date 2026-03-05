import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as svc from '@/services/activityService'

describe('activityService', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('getActivity returns page when ok', async () => {
    const data = { events: [{ id: 'e1', type: 'a' }], nextCursor: null }
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ data }) })) as any

    const res = await svc.getActivity('b1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1/activity', { credentials: 'include' })
    expect(res).toEqual(data)
  })

  it('getActivity throws when non-ok', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, json: async () => ({ error: { message: 'no' } }) })) as any

    await expect(svc.getActivity('b1')).rejects.toThrow('no')
  })
})
