'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as commentService from '@/services/commentService'
import { useCard } from '@/hooks/useCards'
import type { Comment } from '@/types'

function extractComments(card: ReturnType<typeof useCard>['data']): Comment[] {
  if (!card) return []
  // Comments come from the card detail query
  const raw = (card as unknown as Record<string, unknown>).comments
  if (!Array.isArray(raw)) return []
  return raw.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    cardId: c.card_id as string,
    boardId: c.board_id as string,
    authorId: c.author_id as string,
    authorName: ((c.author as Record<string, unknown>)?.display_name as string) ?? 'Unknown',
    authorAvatar: ((c.author as Record<string, unknown>)?.avatar_url as string) ?? null,
    body: c.body as string,
    createdAt: c.created_at as string,
  }))
}

export function useComments(cardId: string | null) {
  const { data: card } = useCard(cardId)
  return {
    comments: extractComments(card),
    cardId,
  }
}

export function useAddComment(cardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => commentService.addComment(cardId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] })
    },
  })
}

export function useDeleteComment(cardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(cardId, commentId),
    onMutate: async (commentId) => {
      // Optimistic: invalidate handled by onSuccess
      return { commentId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] })
    },
  })
}
