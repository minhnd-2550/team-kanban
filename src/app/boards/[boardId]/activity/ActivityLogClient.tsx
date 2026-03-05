'use client'

import { ActivityLog } from '@/components/activity/ActivityLog'

interface ActivityLogClientProps {
  boardId: string
}

export function ActivityLogClient({ boardId }: ActivityLogClientProps) {
  return <ActivityLog boardId={boardId} />
}
