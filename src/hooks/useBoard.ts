'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as boardService from '@/services/boardService'
import { useBoardStore } from '@/store/boardStore'
import type { BoardDetail } from '@/types'

// ─── Hook: Board list ────────────────────────────────────────────────────────
export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await boardService.getBoards()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })
}

// ─── Hook: Board detail ──────────────────────────────────────────────────────
export function useBoard(boardId: string) {
  const setColumns = useBoardStore((s) => s.setColumns)
  const setCards = useBoardStore((s) => s.setCards)

  return useQuery<BoardDetail>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await boardService.getBoard(boardId)
      if (res.error) throw new Error(res.error.message)
      const board = res.data as BoardDetail
      // Seed zustand store with initial data
      const columns = board.columns.map(({ cards: _, ...col }) => col)
      setColumns(columns)
      board.columns.forEach((col) => setCards(col.id, col.cards))
      return board
    },
    enabled: !!boardId,
  })
}

// ─── Mutation: Create board ───────────────────────────────────────────────────
export function useCreateBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => boardService.createBoard(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

// ─── Mutation: Update board ───────────────────────────────────────────────────
export function useUpdateBoard(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => boardService.updateBoard(boardId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

// ─── Mutation: Delete board ───────────────────────────────────────────────────
export function useDeleteBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (boardId: string) => boardService.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

// ─── Mutation: Invite member ──────────────────────────────────────────────────
export function useInviteMember(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => boardService.inviteMember(boardId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

// ─── Mutation: Remove member ──────────────────────────────────────────────────
export function useRemoveMember(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => boardService.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
