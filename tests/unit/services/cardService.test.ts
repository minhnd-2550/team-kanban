import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as svc from '@/services/cardService'

const mockJson = (data: any) => ({ json: async () => ({ data }), ok: true })

describe('cardService', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('createCard posts payload and returns card', async () => {
    const card = { id: 'c1', title: 'T' }
    globalThis.fetch = vi.fn(async () => mockJson(card)) as any

    const res = await svc.createCard({ boardId: 'b1', columnId: 'col1', title: 'T' })
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards', expect.objectContaining({ method: 'POST' }))
    expect(res.data).toEqual(card)
  })

  it('moveCard patches move endpoint', async () => {
    const card = { id: 'c1', columnId: 'col2' }
    globalThis.fetch = vi.fn(async () => mockJson(card)) as any

    const res = await svc.moveCard('c1', 'col2', 0)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/c1/move', expect.objectContaining({ method: 'PATCH' }))
    expect(res.data).toEqual(card)
  })

  it('getCard fetches by id', async () => {
    const card = { id: 'c1', title: 'T' }
    globalThis.fetch = vi.fn(async () => mockJson(card)) as any

    const res = await svc.getCard('c1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/c1', expect.any(Object))
    expect(res.data).toEqual(card)
  })

  it('updateCard patches card', async () => {
    const card = { id: 'c1', title: 'Updated' }
    globalThis.fetch = vi.fn(async () => mockJson(card)) as any

    const res = await svc.updateCard('c1', { title: 'Updated' })
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/c1', expect.objectContaining({ method: 'PATCH' }))
    expect(res.data).toEqual(card)
  })

  it('deleteCard calls delete endpoint', async () => {
    const resp = { deleted: true }
    globalThis.fetch = vi.fn(async () => mockJson(resp)) as any

    const res = await svc.deleteCard('c1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/c1', expect.objectContaining({ method: 'DELETE' }))
    expect(res.data).toEqual(resp)
  })

  it('assignCard patches assign endpoint', async () => {
    const card = { id: 'c1', assigneeId: 'u1' }
    globalThis.fetch = vi.fn(async () => mockJson(card)) as any

    const res = await svc.assignCard('c1', 'u1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/cards/c1/assign', expect.objectContaining({ method: 'PATCH' }))
    expect(res.data).toEqual(card)
  })
})
