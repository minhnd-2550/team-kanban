import type { ApiResponse, Comment } from '@/types'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  return res.json() as Promise<ApiResponse<T>>
}

export async function addComment(cardId: string, body: string): Promise<ApiResponse<Comment>> {
  return fetchJson<Comment>(`/api/v1/cards/${cardId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

export async function deleteComment(
  cardId: string,
  commentId: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchJson<{ deleted: boolean }>(
    `/api/v1/cards/${cardId}/comments/${commentId}`,
    { method: 'DELETE' },
  )
}
