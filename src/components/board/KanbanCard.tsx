'use client'

import { Draggable } from '@hello-pangea/dnd'
import type { Card } from '@/types'
import { Avatar } from '@/components/ui/Avatar'

interface KanbanCardProps {
  card: Card
  index: number
  onClick: (cardId: string) => void
}

export function KanbanCard({ card, index, onClick }: KanbanCardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card.id)}
          className={`cursor-pointer rounded-lg bg-white border border-gray-200 px-3 py-2.5 shadow-sm transition-shadow group ${
            snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
          }`}
        >
          {/* Drag handle icon */}
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 shrink-0 text-gray-400 group-hover:text-gray-600 select-none"
              aria-hidden="true"
            >
              ⠿
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 line-clamp-3">{card.title}</p>
              {card.description && (
                <p className="mt-1 text-xs text-gray-400 line-clamp-1">{card.description}</p>
              )}
            </div>
          </div>

          {/* Assignee avatar */}
          {card.assignee && (
            <div className="mt-2 flex justify-end">
              <Avatar
                src={card.assignee.avatarUrl}
                name={card.assignee.displayName}
                size="xs"
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
