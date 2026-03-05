import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as svc from '@/services/boardService'

const mockJson = (data: any) => ({ json: async () => ({ data }), ok: true })

describe('boardService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('getBoards calls correct endpoint and returns data', async () => {
    const payload = [{ id: 'b1', name: 'Board 1' }]
    globalThis.fetch = vi.fn(async () => mockJson(payload)) as any

    const res = await svc.getBoards()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards', expect.any(Object))
    expect(res.data).toEqual(payload)
  })

  it('createBoard posts name and returns created board', async () => {
    const created = { id: 'b2', name: 'New' }
    globalThis.fetch = vi.fn(async () => mockJson(created)) as any

    const res = await svc.createBoard('New')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards', expect.objectContaining({ method: 'POST' }))
    expect(res.data).toEqual(created)
  })

  it('getBoard fetches board by id', async () => {
    const detail = { id: 'b1', name: 'Board 1', columns: [] }
    globalThis.fetch = vi.fn(async () => mockJson(detail)) as any

    const res = await svc.getBoard('b1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1', expect.any(Object))
    expect(res.data).toEqual(detail)
  })

  it('inviteMember posts to members endpoint', async () => {
    const member = { id: 'u1', email: 'a@b.com' }
    globalThis.fetch = vi.fn(async () => mockJson(member)) as any

    const res = await svc.inviteMember('b1', 'a@b.com')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1/members', expect.objectContaining({ method: 'POST' }))
    expect(res.data).toEqual(member)
  })

  it('updateBoard patches and returns board', async () => {
    const updated = { id: 'b1', name: 'Updated' }
    globalThis.fetch = vi.fn(async () => mockJson(updated)) as any

    const res = await svc.updateBoard('b1', 'Updated')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1', expect.objectContaining({ method: 'PATCH' }))
    expect(res.data).toEqual(updated)
  })

  it('deleteBoard calls delete', async () => {
    const resp = { deleted: true }
    globalThis.fetch = vi.fn(async () => mockJson(resp)) as any

    const res = await svc.deleteBoard('b1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1', expect.objectContaining({ method: 'DELETE' }))
    expect(res.data).toEqual(resp)
  })

  it('getMembers fetches members', async () => {
    const members = [{ id: 'u1' }]
    globalThis.fetch = vi.fn(async () => mockJson(members)) as any

    const res = await svc.getMembers('b1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1/members', expect.any(Object))
    expect(res.data).toEqual(members)
  })

  it('removeMember calls delete member endpoint', async () => {
    const resp = { removed: true }
    globalThis.fetch = vi.fn(async () => mockJson(resp)) as any

    const res = await svc.removeMember('b1', 'u1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/boards/b1/members/u1', expect.objectContaining({ method: 'DELETE' }))
    expect(res.data).toEqual(resp)
  })
})
