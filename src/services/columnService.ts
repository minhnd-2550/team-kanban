import type { ApiResponse, Column } from '@/types'

const BASE = '/api/v1/columns'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  return res.json() as Promise<ApiResponse<T>>
}

export async function createColumn(boardId: string, name: string): Promise<ApiResponse<Column>> {
  return fetchJson<Column>(BASE, {
    method: 'POST',
    body: JSON.stringify({ boardId, name }),
  })
}

export async function updateColumn(columnId: string, name: string): Promise<ApiResponse<Column>> {
  return fetchJson<Column>(`${BASE}/${columnId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export async function deleteColumn(columnId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchJson<{ deleted: boolean }>(`${BASE}/${columnId}?confirm=true`, { method: 'DELETE' })
}
