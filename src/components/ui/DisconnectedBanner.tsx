'use client'

interface DisconnectedBannerProps {
  visible: boolean
}

export function DisconnectedBanner({ visible }: DisconnectedBannerProps) {
  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-lg"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      Reconnecting…
    </div>
  )
}
