'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { useBoardStore } from '@/store/boardStore'
import { useUiStore } from '@/store/uiStore'
import { useRealtimeBoard } from '@/hooks/useRealtimeBoard'
import { DisconnectedBanner } from '@/components/ui/DisconnectedBanner'
import type { BoardDetail } from '@/types'

interface BoardPageClientProps {
  initialBoard: BoardDetail
}

export default function BoardPageClient({ initialBoard }: BoardPageClientProps) {
  const setColumns = useBoardStore((s) => s.setColumns)
  const setCards = useBoardStore((s) => s.setCards)
  const reset = useBoardStore((s) => s.reset)
  const disconnected = useUiStore((s) => s.disconnected)

  // Seed store with SSR data
  useEffect(() => {
    const columns = initialBoard.columns.map(({ cards: _, ...col }) => col)
    setColumns(columns)
    initialBoard.columns.forEach((col) => setCards(col.id, col.cards ?? []))
    return () => reset()
  }, [initialBoard, setColumns, setCards, reset])

  // Subscribe to real-time events
  useRealtimeBoard(initialBoard.id)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Disconnected banner */}
      <DisconnectedBanner visible={disconnected} />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">        
          ← Boards
        </Link>
        <h1 className="text-base font-semibold text-gray-900 truncate">{initialBoard.name}</h1>
        <Link
          href={`/boards/${initialBoard.id}/activity`}
          className="ml-auto text-sm text-gray-700 hover:text-gray-900 font-medium"
        >
          Activity
        </Link>
      </header>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto py-4">
        <KanbanBoard boardId={initialBoard.id} />
      </div>
    </div>
  )
}
