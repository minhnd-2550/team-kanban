import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as svc from '@/services/columnService'

const mockJson = (data: any) => ({ json: async () => ({ data }), ok: true })

describe('columnService', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('createColumn posts and returns created column', async () => {
    const col = { id: 'col1', name: 'Col' }
    globalThis.fetch = vi.fn(async () => mockJson(col)) as any

    const res = await svc.createColumn('b1', 'Col')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/columns', expect.objectContaining({ method: 'POST' }))
    expect(res.data).toEqual(col)
  })

  it('deleteColumn calls delete with confirm', async () => {
    const resp = { deleted: true }
    globalThis.fetch = vi.fn(async () => mockJson(resp)) as any

    const res = await svc.deleteColumn('col1')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/columns/col1?confirm=true', expect.objectContaining({ method: 'DELETE' }))
    expect(res.data).toEqual(resp)
  })
})
