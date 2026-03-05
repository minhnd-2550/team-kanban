'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as cardService from '@/services/cardService'
import * as assignService from '@/services/cardService'
import { useBoardStore } from '@/store/boardStore'
import type { Card } from '@/types'

interface MoveCardParams {
  cardId: string
  fromColumnId: string
  toColumnId: string
  position: number
}

// ─── useMoveCard — optimistic drag-and-drop ────────────────────────────────
export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient()
  const moveCard = useBoardStore((s) => s.moveCard)

  return useMutation({
    mutationFn: ({ cardId, toColumnId, position }: MoveCardParams) =>
      cardService.moveCard(cardId, toColumnId, position),

    onMutate: async ({ cardId, fromColumnId, toColumnId, position }) => {
      // Snapshot current state for rollback
      const snapshot = JSON.parse(JSON.stringify(useBoardStore.getState().cardsByColumn)) as Record<string, Card[]>
      // Apply optimistic move
      moveCard(cardId, fromColumnId, toColumnId, position)
      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      // Roll back to snapshot
      if (context?.snapshot) {
        const store = useBoardStore.getState()
        for (const [colId, cards] of Object.entries(context.snapshot)) {
          store.setCards(colId, cards)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

// ─── useAssignCard — assign/unassign member ────────────────────────────────
export function useAssignCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, assigneeId }: { cardId: string; assigneeId: string | null }) =>
      assignService.assignCard(cardId, assigneeId),
    onSuccess: (_, { cardId }) => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
