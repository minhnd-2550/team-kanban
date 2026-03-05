'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import * as activityService from '@/services/activityService'

export function useActivity(boardId: string) {
  return useInfiniteQuery({
    queryKey: ['board', boardId, 'activity'],
    queryFn: ({ pageParam }) =>
      activityService.getActivity(boardId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}

export function useInvalidateActivity(boardId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['board', boardId, 'activity'] })
}
