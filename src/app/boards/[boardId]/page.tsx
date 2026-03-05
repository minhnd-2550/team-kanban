import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardPageClient from './BoardPageClient'

interface BoardPageProps {
  params: Promise<{ boardId: string }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Prefetch initial board data server-side
  const { data: board, error } = await supabase
    .from('boards')
    .select(`
      id, name, owner_id, created_at, updated_at,
      board_members(id, user_id, role, joined_at,
        profiles:user_id(id, display_name, email, avatar_url)
      ),
      columns(id, board_id, name, position, created_at,
        cards(id, column_id, board_id, title, description, assignee_id, position, created_by, created_at, updated_at)
      )
    `)
    .eq('id', boardId)
    .single()

  if (error || !board) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Board not found or you don&apos;t have access.</p>
      </main>
    )
  }

  return <BoardPageClient initialBoard={board as unknown as Parameters<typeof BoardPageClient>[0]['initialBoard']} />
}
