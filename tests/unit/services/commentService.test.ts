import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as svc from '@/services/commentService'

const mockJson = (data: any) => ({ json: async () => ({ data }), ok: true })

describe('commentService', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('addComment posts comment', async () => {
    const c = { id: 'cm1', body: 'hi' }
    globalThis.fetch = vi.fn(async () => mockJson(c)) as any

    const res = await svc.addComment('card1', 'hi')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/card1/comments', expect.objectContaining({ method: 'POST' }))
    expect(res.data).toEqual(c)
  })

  it('deleteComment calls delete endpoint', async () => {
    const resp = { deleted: true }
    globalThis.fetch = vi.fn(async () => mockJson(resp)) as any

    const res = await svc.deleteComment('card1', 'c1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/card1/comments/c1', expect.objectContaining({ method: 'DELETE' }))
    expect(res.data).toEqual(resp)
  })
})
