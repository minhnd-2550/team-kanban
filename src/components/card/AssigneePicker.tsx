'use client'

import { useState } from 'react'
import type { BoardMember } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { useAssignCard } from '@/hooks/useCardMutations'

interface AssigneePickerProps {
  cardId: string
  boardId: string
  members: BoardMember[]
  currentAssigneeId: string | null | undefined
}

export function AssigneePicker({ cardId, boardId, members, currentAssigneeId }: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const assignCard = useAssignCard(boardId)

  const currentAssignee = members.find((m) => m.userId === currentAssigneeId)

  function handleSelect(userId: string | null) {
    assignCard.mutate({ cardId, assigneeId: userId })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {currentAssignee ? (
          <>
            <Avatar src={currentAssignee.avatarUrl} name={currentAssignee.displayName} size="xs" />
            <span>{currentAssignee.displayName}</span>
          </>
        ) : (
          <span className="text-gray-600">Unassigned</span>
        )}
        <span className="ml-auto text-gray-500">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute z-20 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1"
          >
            <li>
              <button
                role="option"
                aria-selected={currentAssigneeId === null}
                onClick={() => handleSelect(null)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
              >
                Unassigned
              </button>
            </li>
            {members.map((member) => (
              <li key={member.userId}>
                <button
                  role="option"
                  aria-selected={member.userId === currentAssigneeId}
                  onClick={() => handleSelect(member.userId)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    member.userId === currentAssigneeId ? 'font-semibold text-blue-600' : 'text-gray-800'
                  }`}
                >
                  <Avatar src={member.avatarUrl} name={member.displayName} size="xs" />
                  {member.displayName}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
