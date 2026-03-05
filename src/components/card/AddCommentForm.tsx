'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface AddCommentFormProps {
  onSubmit: (body: string) => void
  loading?: boolean
}

const MAX = 2000

export function AddCommentForm({ onSubmit, loading }: AddCommentFormProps) {
  const [body, setBody] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder="Add a comment…"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span
          className={`absolute bottom-2 right-2 text-xs ${
            body.length > MAX * 0.9 ? 'text-red-400' : 'text-gray-300'
          }`}
        >
          {body.length}/{MAX}
        </span>
      </div>
      <Button
        type="submit"
        size="sm"
        loading={loading}
        disabled={!body.trim()}
        className="self-end"
      >
        Comment
      </Button>
    </form>
  )
}
