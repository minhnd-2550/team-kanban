'use client'

import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { useBoardStore } from '@/store/boardStore'
import { useUiStore } from '@/store/uiStore'
import { KanbanColumn } from './KanbanColumn'
import { CardDetailPanel } from '@/components/card/CardDetailPanel'
import { useMoveCard } from '@/hooks/useCardMutations'

interface KanbanBoardProps {
  boardId: string
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const columns = useBoardStore((s) => s.columns)
  const cardsByColumn = useBoardStore((s) => s.cardsByColumn)
  const openCard = useUiStore((s) => s.openCard)
  const moveCardMutation = useMoveCard(boardId)

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result

    // Dropped outside a droppable
    if (!destination) return

    // Dropped in same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    moveCardMutation.mutate({
      cardId: draggableId,
      fromColumnId: source.droppableId,
      toColumnId: destination.droppableId,
      position: destination.index,
    })
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position)

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4">
          {sortedColumns.map((column) => {
            const cards = [...(cardsByColumn[column.id] ?? [])].sort((a, b) => a.position - b.position)
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={cards}
                boardId={boardId}
                onCardClick={openCard}
              />
            )
          })}
        </div>
      </DragDropContext>

      <CardDetailPanel boardId={boardId} />
    </>
  )
}
