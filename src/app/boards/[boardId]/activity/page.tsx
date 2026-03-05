import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ActivityLogClient } from './ActivityLogClient'

interface Props {
  params: Promise<{ boardId: string }>
}

export default async function ActivityPage({ params }: Props) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=/boards/${boardId}/activity`)
  }

  // Fetch board name for the heading
  const { data: board } = await supabase
    .from('boards')
    .select('name')
    .eq('id', boardId)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/boards/${boardId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to board
          </Link>
          <div>
            <p className="text-xs text-gray-400">Activity log</p>
            <h1 className="text-xl font-bold text-gray-900">
              {(board as { name?: string } | null)?.name ?? 'Board'}
            </h1>
          </div>
        </div>

        <ActivityLogClient boardId={boardId} />
      </div>
    </main>
  )
}
