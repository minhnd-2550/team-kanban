'use client'

import { useActivity } from '@/hooks/useActivity'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { ActivityEvent } from '@/types'

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function eventText(event: ActivityEvent): string {
  const name = event.actor?.displayName ?? 'Someone'
  switch (event.eventType) {
    case 'card_created':
      return `${name} created card "${event.cardTitle}"`
    case 'card_moved':
      return `${name} moved "${event.cardTitle}" from ${event.fromColumn} to ${event.toColumn}`
    case 'card_assigned':
      return `${name} assigned "${event.cardTitle}"`
    case 'card_unassigned':
      return `${name} unassigned "${event.cardTitle}"`
    case 'card_deleted':
      return `${name} deleted card "${event.cardTitle}"`
    case 'comment_added':
      return `${name} commented on "${event.cardTitle}"`
    case 'member_added':
      return `${name} added a new member`
    case 'member_removed':
      return `${name} removed a member`
    default:
      return `${name} performed an action`
  }
}

interface ActivityLogProps {
  boardId: string
}

export function ActivityLog({ boardId }: ActivityLogProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useActivity(boardId)

  const events = data?.pages.flatMap((p) => p.events) ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load activity.</p>
  }

  if (events.length === 0) {
    return <p className="text-sm text-gray-400 italic">No activity yet.</p>
  }

  return (
    <div>
      <ul className="space-y-4">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3">
            <Avatar
              src={event.actor?.avatarUrl}
              name={event.actor?.displayName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{eventText(event)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{relativeTime(event.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <div className="mt-6 text-center">
          <Button
            variant="secondary"
            size="sm"
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
