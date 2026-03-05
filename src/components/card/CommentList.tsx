'use client'

import { Avatar } from '@/components/ui/Avatar'
import type { Comment } from '@/types'

interface CommentListProps {
  comments: Comment[]
  currentUserId: string | undefined
  onDelete: (commentId: string) => void
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(date).toLocaleDateString()
}

export function CommentList({ comments, currentUserId, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-gray-600 italic">No comments yet.</p>
  }

  return (
    <ul className="space-y-3">
      {comments
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((comment) => (
          <li key={comment.id} className="flex gap-2.5">
            <Avatar src={comment.authorAvatar} name={comment.authorName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-gray-800">{comment.authorName}</span>
                <span className="text-xs text-gray-500 shrink-0">{relativeTime(comment.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
              {currentUserId === comment.authorId && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="mt-0.5 text-xs text-gray-500 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
    </ul>
  )
}
