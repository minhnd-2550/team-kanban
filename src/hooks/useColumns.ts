'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as columnService from '@/services/columnService'
import { useBoardStore } from '@/store/boardStore'

export function useColumns(boardId: string) {
  const queryClient = useQueryClient()
  const patchColumn = useBoardStore((s) => s.patchColumn)
  const removeColumn = useBoardStore((s) => s.removeColumn)

  const createColumn = useMutation({
    mutationFn: (name: string) => columnService.createColumn(boardId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  const updateColumn = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      columnService.updateColumn(columnId, name),
    onMutate: async ({ columnId, name }) => {
      // Optimistic update
      patchColumn(columnId, { name })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  const deleteColumn = useMutation({
    mutationFn: (columnId: string) => columnService.deleteColumn(columnId),
    onMutate: async (columnId) => {
      removeColumn(columnId)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  return { createColumn, updateColumn, deleteColumn }
}
