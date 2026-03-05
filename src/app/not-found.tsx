import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
        <p className="text-gray-500">
          We couldn&apos;t find what you were looking for.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Go home
        </Link>
      </div>
    </main>
  )
}
