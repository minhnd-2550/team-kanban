// ─── Shared TypeScript interfaces for the Kanban application ────────────────
// These types mirror the database schema and are used throughout the app.

export interface Profile {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

export interface Board {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface BoardMember {
  id: string
  boardId: string
  userId: string
  displayName: string
  avatarUrl: string | null
  role: 'owner' | 'member'
  joinedAt: string
}

export interface Column {
  id: string
  boardId: string
  name: string
  position: number
  createdAt: string
}

export interface Card {
  id: string
  columnId: string
  boardId: string
  title: string
  description: string | null
  assignee: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'> | null
  position: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  cardId: string
  boardId: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  body: string
  createdAt: string
}

export interface ActivityEvent {
  id: string
  boardId: string
  actor: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>
  eventType:
    | 'card_created'
    | 'card_moved'
    | 'card_assigned'
    | 'card_unassigned'
    | 'card_deleted'
    | 'comment_added'
    | 'member_added'
    | 'member_removed'
  cardId: string | null
  cardTitle: string | null
  fromColumn: string | null
  toColumn: string | null
  createdAt: string
}

export interface BoardDetail extends Board {
  members: BoardMember[]
  columns: (Column & { cards: Card[] })[]
}

// ─── API Response Envelope ───────────────────────────────────────────────────
export interface ApiMeta {
  nextCursor?: string | null
  total?: number
}

export interface ApiSuccess<T> {
  data: T
  error: null
  meta: ApiMeta | null
}

export interface ApiError {
  data: null
  error: { code: string; message: string }
  meta: null
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Input types (mirrors Zod schemas) ───────────────────────────────────────
export interface CreateBoardInput { name: string }
export interface UpdateBoardInput { name: string }
export interface CreateColumnInput { boardId: string; name: string }
export interface UpdateColumnInput { name: string }
export interface CreateCardInput { columnId: string; boardId: string; title: string; description?: string }
export interface UpdateCardInput { title?: string; description?: string | null }
export interface MoveCardInput { columnId: string; position: number }
export interface AssignCardInput { assigneeId: string | null }
export interface CreateCommentInput { body: string }
