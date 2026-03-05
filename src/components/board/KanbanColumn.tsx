'use client'

import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import type { Column, Card } from '@/types'
import { Button } from '@/components/ui/Button'
import { KanbanCard } from './KanbanCard'
import { AddCardForm } from '@/components/card/AddCardForm'
import { useColumns } from '@/hooks/useColumns'
import { useCreateCard } from '@/hooks/useCards'

interface KanbanColumnProps {
  column: Column
  cards: Card[]
  boardId: string
  onCardClick: (cardId: string) => void
}

export function KanbanColumn({ column, cards, boardId, onCardClick }: KanbanColumnProps) {
  const { updateColumn, deleteColumn } = useColumns(boardId)
  const createCard = useCreateCard(boardId)
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(column.name)
  const [addingCard, setAddingCard] = useState(false)

  function handleRename() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== column.name) {
      updateColumn.mutate({ columnId: column.id, name: trimmed })
    }
    setEditing(false)
  }

  return (
    <div className="flex flex-col w-64 shrink-0 bg-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-200">
        {editing ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setNameValue(column.name); setEditing(false) }
            }}
            className="flex-1 rounded px-1.5 py-0.5 text-sm font-semibold bg-white border border-blue-400 focus:outline-none text-gray-900"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm font-semibold text-gray-900 hover:text-gray-700 truncate"
            aria-label={`Rename column ${column.name}`}
          >
            {column.name}
          </button>
        )}
        <span className="ml-1.5 rounded-full bg-gray-400 px-1.5 py-0.5 text-xs text-white shrink-0">
          {cards.length}
        </span>
        <button
          onClick={() => {
            if (confirm(`Delete column "${column.name}"? All cards will be lost.`)) {
              deleteColumn.mutate(column.id)
            }
          }}
          className="ml-1 p-1 text-gray-600 hover:text-red-600 rounded"
          aria-label={`Delete column ${column.name}`}
        >
          ×
        </button>
      </div>

      {/* Card list */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 px-2 py-2 min-h-[4rem] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {cards.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-gray-500 text-center py-4">No tasks yet — click + to add one</p>
            )}
            {cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card */}
      {addingCard ? (
        <AddCardForm
          columnId={column.id}
          boardId={boardId}
          loading={createCard.isPending}
          onSubmit={(params) => {
            createCard.mutate(params, { onSuccess: () => setAddingCard(false) })
          }}
          onCancel={() => setAddingCard(false)}
        />
      ) : (
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-700 hover:bg-gray-200"
            onClick={() => setAddingCard(true)}
          >
            + Add card
          </Button>
        </div>
      )}
    </div>
  )
}
