# Data Model: Kanban Board

**Date**: 2026-03-04 | **Plan**: [plan.md](./plan.md)

---

## Entity Overview

```
User ──< BoardMember >── Board ──< Column ──< Card ──< Comment
                                 │                 │
                                 └──< ActivityEvent ┘ (also from BoardMember events)
```

---

## Entities

### `users` (managed by Supabase Auth)

Supabase Auth owns the `auth.users` table. A public `profiles` table mirrors the
user-facing fields and is accessible under RLS.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `auth.uid()` | FK to `auth.users.id` |
| `display_name` | `text` | NOT NULL | 1–50 chars |
| `email` | `text` | NOT NULL, UNIQUE | Read from auth.users |
| `avatar_url` | `text` | NULLABLE | Supabase Storage URL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Validation rules**:
- `display_name`: min 1, max 50 characters; whitespace-only rejected.
- `avatar_url`: must be a valid URL or NULL.

---

### `boards`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | 1–100 chars |
| `owner_id` | `uuid` | NOT NULL, FK → `profiles.id` | Cascade delete on profile delete |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | auto-updated via trigger |

**Validation rules**:
- `name`: min 1, max 100 characters.
- On creation, three `columns` rows are inserted automatically with `position` 0, 1, 2
  and names "To Do", "In Progress", "Done" (Postgres function / application service).

**State transitions**: None (no status field).

---

### `board_members`

Join table controlling board access.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `board_id` | `uuid` | NOT NULL, FK → `boards.id` ON DELETE CASCADE | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles.id` ON DELETE CASCADE | |
| `role` | `text` | NOT NULL, CHECK IN ('owner','member') | |
| `joined_at` | `timestamptz` | NOT NULL, default `now()` | |

**Unique constraint**: `(board_id, user_id)`.

**Validation rules**:
- `role`: only `'owner'` or `'member'` accepted.
- A board MUST always have exactly one `owner`. Deleting the last owner is FORBIDDEN.

---

### `columns`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `board_id` | `uuid` | NOT NULL, FK → `boards.id` ON DELETE CASCADE | |
| `name` | `text` | NOT NULL | 1–50 chars |
| `position` | `integer` | NOT NULL | 0-indexed, unique within board |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Validation rules**:
- `name`: min 1, max 50 characters.
- `position`: non-negative integer; unique within `board_id` (enforced by unique constraint
  `(board_id, position)`).

---

### `cards`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `column_id` | `uuid` | NOT NULL, FK → `columns.id` ON DELETE CASCADE | |
| `board_id` | `uuid` | NOT NULL, FK → `boards.id` ON DELETE CASCADE | Denormalised for RLS / Realtime filtering |
| `title` | `text` | NOT NULL | 1–255 chars |
| `description` | `text` | NULLABLE | Plain text, max 5 000 chars |
| `assignee_id` | `uuid` | NULLABLE, FK → `profiles.id` ON DELETE SET NULL | |
| `position` | `integer` | NOT NULL | 0-indexed within column |
| `created_by` | `uuid` | NOT NULL, FK → `profiles.id` | Immutable after creation |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | auto-updated via `moddatetime` trigger |

**Validation rules**:
- `title`: min 1, max 255 characters; whitespace-only rejected.
- `description`: max 5 000 characters or NULL.
- `position`: non-negative integer; unique within `column_id` (application-managed; no DB
  constraint to avoid lock contention during drag-and-drop reorder).

**State transitions** (column change = status change):

```
[Any Column] ──drag-and-drop──> [Any Other Column]
```

- Trigger: `PATCH /api/v1/cards/:id/move` sets `column_id` and adjusts `position`.
- `updated_at` is refreshed automatically; Realtime CDC broadcasts the UPDATE.

---

### `comments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `card_id` | `uuid` | NOT NULL, FK → `cards.id` ON DELETE CASCADE | |
| `board_id` | `uuid` | NOT NULL, FK → `boards.id` ON DELETE CASCADE | Denormalised for RLS |
| `author_id` | `uuid` | NOT NULL, FK → `profiles.id` ON DELETE CASCADE | |
| `body` | `text` | NOT NULL | 1–2 000 chars |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Validation rules**:
- `body`: min 1, max 2 000 characters; whitespace-only rejected.
- Comments are immutable after creation (no `updated_at`; no edit endpoint in v1).

---

### `activity_events`

Append-only audit log; populated exclusively by Postgres triggers.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `board_id` | `uuid` | NOT NULL, FK → `boards.id` ON DELETE CASCADE | |
| `actor_id` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `event_type` | `text` | NOT NULL, CHECK enumerated | See event types below |
| `card_id` | `uuid` | NULLABLE | Reference to card (may be deleted) |
| `card_title_snapshot` | `text` | NULLABLE | Captured at event time (preserved after card deletion) |
| `from_column_id` | `uuid` | NULLABLE | For `card_moved` events |
| `to_column_id` | `uuid` | NULLABLE | For `card_moved` events |
| `from_column_name` | `text` | NULLABLE | Snapshot at event time |
| `to_column_name` | `text` | NULLABLE | Snapshot at event time |
| `meta` | `jsonb` | NULLABLE | Extensible extra data |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Event type enum** (`CHECK (event_type IN (…))`):

| Value | Triggered by |
|---|---|
| `card_created` | INSERT on `cards` |
| `card_moved` | UPDATE on `cards` where `column_id` changes |
| `card_assigned` | UPDATE on `cards` where `assignee_id` changes to non-NULL |
| `card_unassigned` | UPDATE on `cards` where `assignee_id` changes to NULL |
| `card_deleted` | DELETE on `cards` |
| `comment_added` | INSERT on `comments` |
| `member_added` | INSERT on `board_members` |
| `member_removed` | DELETE on `board_members` |

---

## Indexes

```sql
-- Board membership lookups
CREATE INDEX idx_board_members_user   ON board_members(user_id);
CREATE INDEX idx_board_members_board  ON board_members(board_id);

-- Column ordering
CREATE INDEX idx_columns_board_pos    ON columns(board_id, position);

-- Card ordering within column
CREATE INDEX idx_cards_column_pos     ON cards(column_id, position);

-- Card lookup by board (used in RLS + Realtime filter)
CREATE INDEX idx_cards_board          ON cards(board_id);

-- Comment chronological listing
CREATE INDEX idx_comments_card_time   ON comments(card_id, created_at ASC);

-- Activity log per board
CREATE INDEX idx_activity_board_time  ON activity_events(board_id, created_at DESC);
```

---

## Row Level Security (RLS) Policies

All tables have RLS **enabled**. The pattern is:

```sql
-- Generic "board member" check used by most policies
-- (stored as a security-definer function for performance)
CREATE FUNCTION is_board_member(p_board_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid()
  );
$$;
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row or any board member on same board | Own row only | Own row only | — |
| `boards` | `is_board_member(id)` | `auth.uid()` is set | Owner only | Owner only |
| `board_members` | `is_board_member(board_id)` | Owner of board | — | Owner (others) or self (leave) |
| `columns` | `is_board_member(board_id)` | `is_board_member(board_id)` | `is_board_member(board_id)` | `is_board_member(board_id)` |
| `cards` | `is_board_member(board_id)` | `is_board_member(board_id)` | `is_board_member(board_id)` | Creator or owner |
| `comments` | `is_board_member(board_id)` | `is_board_member(board_id)` | — (no edit v1) | `author_id = auth.uid()` or board owner |
| `activity_events` | `is_board_member(board_id)` | TRIGGER only (no direct insert) | — | — |

---

## Realtime Subscriptions

| Channel | Table | Filter | Purpose |
|---|---|---|---|
| `board:{boardId}:columns` | `columns` | `board_id=eq.{boardId}` | Column adds/renames |
| `board:{boardId}:cards` | `cards` | `board_id=eq.{boardId}` | Card CRUD + moves |
| `board:{boardId}:comments` | `comments` | `board_id=eq.{boardId}` | New comments on any card |
| `board:{boardId}:activity` | `activity_events` | `board_id=eq.{boardId}` | Live activity feed |
