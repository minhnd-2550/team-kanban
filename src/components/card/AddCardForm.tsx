'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface AddCardFormProps {
  columnId: string
  boardId: string
  onSubmit: (params: { columnId: string; boardId: string; title: string }) => void
  onCancel: () => void
  loading?: boolean
}

export function AddCardForm({ columnId, boardId, onSubmit, onCancel, loading }: AddCardFormProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({ columnId, boardId, title: trimmed })
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-2 pb-2">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Card title…"
        maxLength={255}
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-1.5">
        <Button type="submit" size="sm" loading={loading} disabled={!title.trim()}>
          Add card
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
