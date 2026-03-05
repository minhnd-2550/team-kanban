import type { ApiResponse, Card } from '@/types'

const BASE = '/api/v1/cards'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  return res.json() as Promise<ApiResponse<T>>
}

export async function createCard(params: {
  columnId: string
  boardId: string
  title: string
  description?: string
}): Promise<ApiResponse<Card>> {
  return fetchJson<Card>(BASE, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getCard(cardId: string): Promise<ApiResponse<Card>> {
  return fetchJson<Card>(`${BASE}/${cardId}`)
}

export async function updateCard(
  cardId: string,
  patch: { title?: string; description?: string | null },
): Promise<ApiResponse<Card>> {
  return fetchJson<Card>(`${BASE}/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteCard(cardId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchJson<{ deleted: boolean }>(`${BASE}/${cardId}`, { method: 'DELETE' })
}

export async function moveCard(
  cardId: string,
  columnId: string,
  position: number,
): Promise<ApiResponse<Card>> {
  return fetchJson<Card>(`${BASE}/${cardId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ columnId, position }),
  })
}

export async function assignCard(
  cardId: string,
  assigneeId: string | null,
): Promise<ApiResponse<Card>> {
  return fetchJson<Card>(`${BASE}/${cardId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigneeId }),
  })
}
