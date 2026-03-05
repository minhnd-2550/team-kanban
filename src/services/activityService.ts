import type { ActivityEvent } from '@/types'

interface ActivityPage {
  events: ActivityEvent[]
  nextCursor: string | null
}

export async function getActivity(
  boardId: string,
  cursor?: string | null,
): Promise<ActivityPage> {
  const params = new URLSearchParams()
  if (cursor) params.set('before', cursor)

  const qs = params.toString()
  const url = `/api/v1/boards/${boardId}/activity${qs ? `?${qs}` : ''}`

  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? 'Failed to fetch activity')
  }

  const json = await res.json()
  return json.data as ActivityPage
}
