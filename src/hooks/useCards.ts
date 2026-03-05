'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as cardService from '@/services/cardService'
import { useBoardStore } from '@/store/boardStore'
import type { Card } from '@/types'

// ─── Hook: Card detail ─────────────────────────────────────────────────────
export function useCard(cardId: string | null) {
  return useQuery<Card>({
    queryKey: ['card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('No cardId')
      const res = await cardService.getCard(cardId)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!cardId,
  })
}

// ─── Mutation: Create card ──────────────────────────────────────────────────
export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient()
  const addCard = useBoardStore((s) => s.addCard)

  return useMutation({
    mutationFn: (params: { columnId: string; boardId: string; title: string; description?: string }) =>
      cardService.createCard(params),
    onSuccess: (res) => {
      if (res.data) {
        // Map DB snake_case to our camelCase Card interface
        const card = res.data as unknown as Record<string, unknown>
        addCard({
          id: card.id as string,
          columnId: card.column_id as string,
          boardId: card.board_id as string,
          title: card.title as string,
          description: (card.description as string) ?? null,
          assignee: null,
          position: card.position as number,
          createdBy: card.created_by as string,
          createdAt: card.created_at as string,
          updatedAt: card.updated_at as string,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

// ─── Mutation: Update card ──────────────────────────────────────────────────
export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient()
  const patchCard = useBoardStore((s) => s.patchCard)

  return useMutation({
    mutationFn: ({
      cardId,
      patch,
    }: {
      cardId: string
      patch: { title?: string; description?: string | null }
    }) => cardService.updateCard(cardId, patch),
    onMutate: async ({ cardId, patch }) => {
      patchCard(cardId, patch as Partial<Card>)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
    onSuccess: (_, { cardId }) => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] })
    },
  })
}

// ─── Mutation: Delete card ──────────────────────────────────────────────────
export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient()
  const removeCard = useBoardStore((s) => s.removeCard)

  return useMutation({
    mutationFn: (cardId: string) => cardService.deleteCard(cardId),
    onMutate: async (cardId) => {
      removeCard(cardId)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
