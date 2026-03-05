'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCreateBoard } from '@/hooks/useBoard'

interface CreateBoardModalProps {
  open: boolean
  onClose: () => void
}

export function CreateBoardModal({ open, onClose }: CreateBoardModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createBoard = useCreateBoard()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = name.trim()
    if (!trimmed) return setError('Board name is required')
    if (trimmed.length > 100) return setError('Name must be ≤ 100 characters')

    const res = await createBoard.mutateAsync(trimmed)
    if (res.error) {
      setError(res.error.message)
      return
    }

    setName('')
    onClose()
    router.push(`/boards/${res.data.id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Create board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Product Roadmap"
          maxLength={100}
          autoFocus
          error={error ?? undefined}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createBoard.isPending}>
            Create board
          </Button>
        </div>
      </form>
    </Modal>
  )
}
