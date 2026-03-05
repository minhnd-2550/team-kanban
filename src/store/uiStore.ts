import { create } from 'zustand'

interface UiState {
  // Card detail panel
  activeCardId: string | null
  openCard: (cardId: string) => void
  closeCard: () => void

  // Realtime connection status
  disconnected: boolean
  setDisconnected: (value: boolean) => void

  // Board member invite modal
  inviteModalOpen: boolean
  openInviteModal: () => void
  closeInviteModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activeCardId: null,
  openCard: (cardId) => set({ activeCardId: cardId }),
  closeCard: () => set({ activeCardId: null }),

  disconnected: false,
  setDisconnected: (value) => set({ disconnected: value }),

  inviteModalOpen: false,
  openInviteModal: () => set({ inviteModalOpen: true }),
  closeInviteModal: () => set({ inviteModalOpen: false }),
}))
