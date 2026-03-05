'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBoards, useDeleteBoard } from '@/hooks/useBoard'
import { CreateBoardModal } from '@/components/board/CreateBoardModal'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  const { data: boards, isLoading, error } = useBoards()
  const deleteBoard = useDeleteBoard()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
          <Button onClick={() => setModalOpen(true)}>+ New Board</Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm">Failed to load boards. Please refresh.</p>
        )}

        {boards && boards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-500 mb-4">You have no boards yet.</p>
            <Button onClick={() => setModalOpen(true)}>Create your first board</Button>
          </div>
        )}

        {boards && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative flex flex-col justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/boards/${board.id}`} className="absolute inset-0 rounded-xl" aria-label={board.name} />
                <div>
                  <h2 className="font-semibold text-gray-900 truncate">{board.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {new Date(board.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex justify-end mt-4 relative z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      if (confirm(`Delete board "${board.name}"?`)) {
                        deleteBoard.mutate(board.id)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateBoardModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  )
}
