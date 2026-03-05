import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Column, Card } from '@/types'

interface BoardState {
  columns: Column[]
  cardsByColumn: Record<string, Card[]>

  // Column actions
  setColumns: (columns: Column[]) => void
  patchColumn: (columnId: string, patch: Partial<Column>) => void
  removeColumn: (columnId: string) => void

  // Card actions
  setCards: (columnId: string, cards: Card[]) => void
  addCard: (card: Card) => void
  patchCard: (cardId: string, patch: Partial<Card>) => void
  removeCard: (cardId: string) => void

  // Drag-and-drop — optimistic move
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, newPosition: number) => void

  // Reset
  reset: () => void
}

const initialState = {
  columns: [] as Column[],
  cardsByColumn: {} as Record<string, Card[]>,
}

export const useBoardStore = create<BoardState>()(
  immer((set) => ({
    ...initialState,

    setColumns: (columns) =>
      set((state) => {
        state.columns = columns
      }),

    patchColumn: (columnId, patch) =>
      set((state) => {
        const idx = state.columns.findIndex((c) => c.id === columnId)
        if (idx !== -1) Object.assign(state.columns[idx], patch)
      }),

    removeColumn: (columnId) =>
      set((state) => {
        state.columns = state.columns.filter((c) => c.id !== columnId)
        delete state.cardsByColumn[columnId]
      }),

    setCards: (columnId, cards) =>
      set((state) => {
        state.cardsByColumn[columnId] = cards
      }),

    addCard: (card) =>
      set((state) => {
        const list = state.cardsByColumn[card.columnId] ?? []
        list.push(card)
        state.cardsByColumn[card.columnId] = list
      }),

    patchCard: (cardId, patch) =>
      set((state) => {
        for (const columnId of Object.keys(state.cardsByColumn)) {
          const cards = state.cardsByColumn[columnId]
          const idx = cards.findIndex((c) => c.id === cardId)
          if (idx !== -1) {
            Object.assign(cards[idx], patch)
            break
          }
        }
      }),

    removeCard: (cardId) =>
      set((state) => {
        for (const columnId of Object.keys(state.cardsByColumn)) {
          const before = state.cardsByColumn[columnId].length
          state.cardsByColumn[columnId] = state.cardsByColumn[columnId].filter(
            (c) => c.id !== cardId,
          )
          if (state.cardsByColumn[columnId].length !== before) break
        }
      }),

    moveCard: (cardId, fromColumnId, toColumnId, newPosition) =>
      set((state) => {
        const fromList = state.cardsByColumn[fromColumnId] ?? []
        const cardIdx = fromList.findIndex((c) => c.id === cardId)
        if (cardIdx === -1) return

        const [card] = fromList.splice(cardIdx, 1)
        card.columnId = toColumnId
        card.position = newPosition

        const toList = state.cardsByColumn[toColumnId] ?? []
        toList.splice(newPosition, 0, card)
        state.cardsByColumn[toColumnId] = toList

        // Re-compute positions in both columns
        state.cardsByColumn[fromColumnId] = fromList.map((c, i) => ({ ...c, position: i }))
        state.cardsByColumn[toColumnId] = state.cardsByColumn[toColumnId].map((c, i) => ({
          ...c,
          position: i,
        }))
      }),

    reset: () =>
      set((state) => {
        state.columns = []
        state.cardsByColumn = {}
      }),
  })),
)
