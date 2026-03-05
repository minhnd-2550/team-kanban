'use client'

import { useState, useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useCard, useUpdateCard, useDeleteCard } from '@/hooks/useCards'
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments'
import { useBoard } from '@/hooks/useBoard'
import { Button } from '@/components/ui/Button'
import { AssigneePicker } from '@/components/card/AssigneePicker'
import { CommentList } from '@/components/card/CommentList'
import { AddCommentForm } from '@/components/card/AddCommentForm'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface CardDetailPanelProps {
  boardId: string
}

export function CardDetailPanel({ boardId }: CardDetailPanelProps) {
  const activeCardId = useUiStore((s) => s.activeCardId)
  const closeCard = useUiStore((s) => s.closeCard)
  const { data: card, isLoading } = useCard(activeCardId)
  const updateCard = useUpdateCard(boardId)
  const deleteCard = useDeleteCard(boardId)
  const { data: board } = useBoard(boardId)
  const { comments } = useComments(activeCardId)
  const addComment = useAddComment(activeCardId ?? '')
  const deleteComment = useDeleteComment(activeCardId ?? '')

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id))
  }, [])

  useEffect(() => {
    if (card) {
      setTitleValue(card.title)
      setDescValue(card.description ?? '')
    }
  }, [card])

  if (!activeCardId) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={closeCard} />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Card details"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Card detail</h2>
          <Button variant="ghost" size="sm" onClick={closeCard} aria-label="Close panel">
            ✕
          </Button>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Loading…</p>
          </div>
        )}

        {card && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Title */}
            {editingTitle ? (
              <input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => {
                  const trimmed = titleValue.trim()
                  if (trimmed && trimmed !== card.title) {
                    updateCard.mutate({ cardId: card.id, patch: { title: trimmed } })
                  }
                  setEditingTitle(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') { setTitleValue(card.title); setEditingTitle(false) }
                }}
                className="w-full rounded-lg border border-blue-400 px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="w-full text-left text-lg font-semibold text-gray-900 hover:text-blue-600"
              >
                {card.title}
              </button>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">Description</p>
              {editingDesc ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    autoFocus
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    maxLength={5000}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateCard.mutate({ cardId: card.id, patch: { description: descValue || null } })
                        setEditingDesc(false)
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDescValue(card.description ?? ''); setEditingDesc(false) }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="w-full text-left text-sm text-gray-800 hover:text-gray-900 min-h-[2rem]"
                >
                  {card.description || <span className="text-gray-500 italic">Add a description…</span>}
                </button>
              )}
            </div>

            {/* Assignee */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">Assignee</p>
              <AssigneePicker
                cardId={card.id}
                boardId={boardId}
                members={board?.members ?? []}
                currentAssigneeId={card.assignee?.id ?? null}
              />
            </div>

            {/* Comments */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Comments</p>
              <div className="space-y-4">
                <CommentList
                  comments={comments}
                  currentUserId={currentUserId}
                  onDelete={(commentId) => deleteComment.mutate(commentId)}
                />
                <AddCommentForm
                  onSubmit={(body) => addComment.mutate(body)}
                  loading={addComment.isPending}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete */}
        {card && (
          <div className="border-t border-gray-200 px-5 py-3">
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => {
                if (confirm('Delete this card?')) {
                  deleteCard.mutate(card.id)
                  closeCard()
                }
              }}
            >
              Delete card
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}
