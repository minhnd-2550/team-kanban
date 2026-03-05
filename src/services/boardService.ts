import type { ApiResponse, Board, BoardDetail, BoardMember } from '@/types'

const BASE = '/api/v1/boards'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  return res.json() as Promise<ApiResponse<T>>
}

export async function getBoards(): Promise<ApiResponse<Board[]>> {
  return fetchJson<Board[]>(BASE)
}

export async function createBoard(name: string): Promise<ApiResponse<Board>> {
  return fetchJson<Board>(BASE, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function getBoard(boardId: string): Promise<ApiResponse<BoardDetail>> {
  return fetchJson<BoardDetail>(`${BASE}/${boardId}`)
}

export async function updateBoard(boardId: string, name: string): Promise<ApiResponse<Board>> {
  return fetchJson<Board>(`${BASE}/${boardId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export async function deleteBoard(boardId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchJson<{ deleted: boolean }>(`${BASE}/${boardId}`, { method: 'DELETE' })
}

export async function getMembers(boardId: string): Promise<ApiResponse<BoardMember[]>> {
  return fetchJson<BoardMember[]>(`${BASE}/${boardId}/members`)
}

export async function inviteMember(boardId: string, email: string): Promise<ApiResponse<BoardMember>> {
  return fetchJson<BoardMember>(`${BASE}/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function removeMember(boardId: string, userId: string): Promise<ApiResponse<{ removed: boolean }>> {
  return fetchJson<{ removed: boolean }>(`${BASE}/${boardId}/members/${userId}`, { method: 'DELETE' })
}
