import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-3 space-y-2 shadow-sm">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className="w-72 shrink-0 rounded-2xl bg-gray-100 p-3 space-y-3">
      <Skeleton className="h-4 w-24" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

export function BoardPageSkeleton() {
  return (
    <div className="flex gap-4 px-6 py-6 overflow-x-auto">
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  )
}
