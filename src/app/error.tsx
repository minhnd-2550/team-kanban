'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to your error service here
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-sm px-4">
        <p className="text-6xl font-bold text-gray-200">500</p>
        <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500 text-sm">
          An unexpected error occurred. You can try again or head back home.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button size="sm" variant="secondary">
              Go home
            </Button>
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-300">Error ID: {error.digest}</p>
        )}
      </div>
    </main>
  )
}
