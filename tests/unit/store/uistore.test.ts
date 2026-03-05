import { describe, it, expect } from 'vitest'
import { useUiStore } from '@/store/uistore'

describe('uiStore', () => {
  it('open and close card', () => {
    useUiStore.getState().openCard('c1')
    expect(useUiStore.getState().activeCardId).toBe('c1')
    useUiStore.getState().closeCard()
    expect(useUiStore.getState().activeCardId).toBeNull()
  })

  it('set disconnected', () => {
    useUiStore.getState().setDisconnected(true)
    expect(useUiStore.getState().disconnected).toBe(true)
  })

  it('invite modal open/close', () => {
    useUiStore.getState().openInviteModal()
    expect(useUiStore.getState().inviteModalOpen).toBe(true)
    useUiStore.getState().closeInviteModal()
    expect(useUiStore.getState().inviteModalOpen).toBe(false)
  })
})
