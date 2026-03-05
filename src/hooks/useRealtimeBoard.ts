'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/boardStore'
import { useUiStore } from '@/store/uiStore'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Card } from '@/types'

function dbCardToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    columnId: row.column_id as string,
    boardId: row.board_id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    assignee: null, // realtime payload won't include join; refetch for assignee details
    position: row.position as number,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function useRealtimeBoard(boardId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const queryClient = useQueryClient()
  const addCard = useBoardStore((s) => s.addCard)
  const patchCard = useBoardStore((s) => s.patchCard)
  const removeCard = useBoardStore((s) => s.removeCard)
  const patchColumn = useBoardStore((s) => s.patchColumn)
  const removeColumn = useBoardStore((s) => s.removeColumn)
  const setDisconnected = useUiStore((s) => s.setDisconnected)

  useEffect(() => {
    if (!boardId) return

    const supabase = getSupabaseBrowserClient()

    const channel = supabase
      .channel(`board:${boardId}`)
      // ─── Cards ────────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` },
        (payload) => {
          addCard(dbCardToCard(payload.new as Record<string, unknown>))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>
          const oldRow = payload.old as Record<string, unknown>

          // Stale-event guard (T067): discard if incoming is older than what we have
          const localCards = useBoardStore.getState().cardsByColumn
          let localCard: Card | undefined
          for (const cards of Object.values(localCards)) {
            localCard = cards.find((c) => c.id === newRow.id)
            if (localCard) break
          }
          if (localCard && newRow.updated_at && localCard.updatedAt >= (newRow.updated_at as string)) {
            return // stale — ignore
          }

          const patch: Partial<Card> = {}
          if (newRow.column_id !== oldRow.column_id) patch.columnId = newRow.column_id as string
          if (newRow.title !== oldRow.title) patch.title = newRow.title as string
          if (newRow.description !== oldRow.description) patch.description = (newRow.description as string) ?? null
          if (newRow.position !== oldRow.position) patch.position = newRow.position as number
          if (newRow.assignee_id !== oldRow.assignee_id) {
            // For assignee changes, invalidate board query to get joined data
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
          }
          if (Object.keys(patch).length > 0) {
            patchCard(newRow.id as string, patch)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` },
        (payload) => {
          removeCard((payload.old as Record<string, unknown>).id as string)
        },
      )
      // ─── Columns ──────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const col = payload.new as Record<string, unknown>
          patchColumn(col.id as string, { name: col.name as string })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        (payload) => {
          removeColumn((payload.old as Record<string, unknown>).id as string)
        },
      )
      // ─── Activity + Comments: invalidate query cache ────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const newEvent = {
            id: row.id as string,
            eventType: row.event_type as string,
            cardId: row.card_id as string | null,
            cardTitle: row.card_title as string | null,
            fromColumn: row.from_column as string | null,
            toColumn: row.to_column as string | null,
            createdAt: row.created_at as string,
            actor: null, // actor join not available in CDC payload; invalidate for full data
          }
          // Optimistically prepend then invalidate for actor data
          queryClient.setQueryData(
            ['board', boardId, 'activity'],
            (old: { pages: { events: unknown[]; nextCursor: string | null }[] } | undefined) => {
              if (!old?.pages?.length) return old
              return {
                ...old,
                pages: [
                  { ...old.pages[0], events: [newEvent, ...old.pages[0].events] },
                  ...old.pages.slice(1),
                ],
              }
            },
          )
          // Then invalidate to fetch full actor profile data
          queryClient.invalidateQueries({ queryKey: ['board', boardId, 'activity'] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const comment = payload.new as Record<string, unknown>
          queryClient.invalidateQueries({ queryKey: ['card', comment.card_id, 'comments'] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const comment = payload.old as Record<string, unknown>
          queryClient.invalidateQueries({ queryKey: ['card', comment.card_id, 'comments'] })
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setDisconnected(false)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setDisconnected(true)
        if (status === 'CLOSED') setDisconnected(true)
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [boardId, addCard, patchCard, removeCard, patchColumn, removeColumn, setDisconnected, queryClient])
}
