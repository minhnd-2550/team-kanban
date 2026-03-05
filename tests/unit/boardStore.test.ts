import { describe, it, expect, beforeEach } from 'vitest'
import { useBoardStore } from '@/store/boardStore'
import type { Column, Card } from '@/types'

const mockColumn: Column = {
  id: 'col-1',
  boardId: 'board-1',
  name: 'To Do',
  position: 0,
  createdAt: new Date().toISOString(),
}

const mockCard: Card = {
  id: 'card-1',
  columnId: 'col-1',
  boardId: 'board-1',
  title: 'Test card',
  description: null,
  assignee: null,
  position: 0,
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.getState().reset()
  })

  it('sets columns', () => {
    useBoardStore.getState().setColumns([mockColumn])
    expect(useBoardStore.getState().columns).toHaveLength(1)
    expect(useBoardStore.getState().columns[0].name).toBe('To Do')
  })

  it('patches a column', () => {
    useBoardStore.getState().setColumns([mockColumn])
    useBoardStore.getState().patchColumn('col-1', { name: 'In Progress' })
    expect(useBoardStore.getState().columns[0].name).toBe('In Progress')
  })

  it('removes a column', () => {
    useBoardStore.getState().setColumns([mockColumn])
    useBoardStore.getState().removeColumn('col-1')
    expect(useBoardStore.getState().columns).toHaveLength(0)
  })

  it('adds a card', () => {
    useBoardStore.getState().setCards('col-1', [])
    useBoardStore.getState().addCard(mockCard)
    expect(useBoardStore.getState().cardsByColumn['col-1']).toHaveLength(1)
  })

  it('removes a card', () => {
    useBoardStore.getState().setCards('col-1', [mockCard])
    useBoardStore.getState().removeCard('card-1')
    expect(useBoardStore.getState().cardsByColumn['col-1']).toHaveLength(0)
  })

  it('moves a card to another column', () => {
    const col2: Column = { ...mockColumn, id: 'col-2', name: 'In Progress', position: 1 }
    useBoardStore.getState().setColumns([mockColumn, col2])
    useBoardStore.getState().setCards('col-1', [mockCard])
    useBoardStore.getState().setCards('col-2', [])
    useBoardStore.getState().moveCard('card-1', 'col-1', 'col-2', 0)
    expect(useBoardStore.getState().cardsByColumn['col-1']).toHaveLength(0)
    expect(useBoardStore.getState().cardsByColumn['col-2']).toHaveLength(1)
  })
})
