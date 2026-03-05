# REST API Contract: Kanban Board v1

**Date**: 2026-03-04 | **Plan**: [../plan.md](../plan.md)  
**Base URL**: `/api/v1`  
**Auth**: All endpoints require `Authorization: Bearer <supabase_access_token>` unless marked public.

---

## Response Envelope

Every response MUST use this shape:

```ts
// Success
{ "data": <T>, "error": null, "meta": { ...pagination? } }

// Error
{ "data": null, "error": { "code": string, "message": string }, "meta": null }
```

---

## Boards

### `GET /boards`
List all boards the authenticated user is a member of.

**Response `data`**:
```ts
Array<{
  id: string;          // uuid
  name: string;
  role: "owner" | "member";
  memberCount: number;
  createdAt: string;   // ISO 8601
}>
```

---

### `POST /boards`
Create a new board. Automatically creates three columns and inserts the creator as owner.

**Request body**:
```ts
{ name: string }  // 1–100 chars
```

**Response `data`** (`201 Created`):
```ts
{
  id: string;
  name: string;
  columns: Array<{ id: string; name: string; position: number }>;
  createdAt: string;
}
```

**Errors**:
| Code | Message |
|---|---|
| `VALIDATION_ERROR` | `name` is empty or > 100 chars |

---

### `GET /boards/:boardId`
Get a board with its columns and cards.

**Response `data`**:
```ts
{
  id: string;
  name: string;
  ownerId: string;
  members: Array<{ userId: string; displayName: string; avatarUrl: string | null; role: string }>;
  columns: Array<{
    id: string;
    name: string;
    position: number;
    cards: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      assignee: { userId: string; displayName: string; avatarUrl: string | null } | null;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
}
```

**Errors**:
| Code | Message |
|---|---|
| `NOT_FOUND` | Board does not exist or user is not a member |

---

### `PATCH /boards/:boardId`
Update board name. Owner only.

**Request body**:
```ts
{ name: string }  // 1–100 chars
```

**Response `data`**: Updated board `{ id, name, updatedAt }`.

---

### `DELETE /boards/:boardId`
Delete board and all its data. Owner only.

**Response**: `204 No Content` (data: null, error: null, meta: null).

---

### `GET /boards/:boardId/members`
List all board members.

**Response `data`**:
```ts
Array<{ userId: string; displayName: string; avatarUrl: string | null; role: string; joinedAt: string }>
```

---

### `POST /boards/:boardId/members`
Invite a member by email. Owner only.

**Request body**:
```ts
{ email: string }
```

**Response `data`** (`201 Created`):
```ts
{ userId: string; displayName: string; role: "member"; joinedAt: string }
```

**Errors**:
| Code | Message |
|---|---|
| `NOT_FOUND` | No registered user with that email |
| `CONFLICT` | User is already a member of this board |

---

### `DELETE /boards/:boardId/members/:userId`
Remove a member. Owner only (or self-remove).

**Response**: `204 No Content`.

**Errors**:
| Code | Message |
|---|---|
| `FORBIDDEN` | Attempting to remove the last owner |

---

## Columns

### `POST /columns`
Create a new column on a board.

**Request body**:
```ts
{ boardId: string; name: string }  // name: 1–50 chars
```

**Response `data`** (`201 Created`):
```ts
{ id: string; boardId: string; name: string; position: number; createdAt: string }
```

---

### `PATCH /columns/:columnId`
Rename a column.

**Request body**:
```ts
{ name: string }  // 1–50 chars
```

**Response `data`**: `{ id, name }`.

---

### `DELETE /columns/:columnId`
Delete a column and all its cards. Requires explicit `?confirm=true` if column has cards.

**Query params**: `confirm=true` (required when column contains cards).

**Response**: `204 No Content`.

**Errors**:
| Code | Message |
|---|---|
| `CONFIRMATION_REQUIRED` | Column has cards; pass `?confirm=true` to proceed |

---

## Cards

### `POST /cards`
Create a card in a column.

**Request body**:
```ts
{
  columnId: string;
  boardId: string;
  title: string;       // 1–255 chars
  description?: string; // max 5 000 chars
}
```

**Response `data`** (`201 Created`):
```ts
{
  id: string; columnId: string; boardId: string; title: string;
  description: string | null; position: number;
  assignee: null; createdBy: string; createdAt: string; updatedAt: string;
}
```

---

### `GET /cards/:cardId`
Get card detail including comments.

**Response `data`**:
```ts
{
  id: string; columnId: string; boardId: string;
  title: string; description: string | null; position: number;
  assignee: { userId: string; displayName: string; avatarUrl: string | null } | null;
  createdBy: string; createdAt: string; updatedAt: string;
  comments: Array<{
    id: string; authorId: string; authorName: string; authorAvatar: string | null;
    body: string; createdAt: string;
  }>;
}
```

---

### `PATCH /cards/:cardId`
Update title or description.

**Request body**:
```ts
{ title?: string; description?: string | null }
```

**Response `data`**: Updated card `{ id, title, description, updatedAt }`.

---

### `DELETE /cards/:cardId`
Delete a card. Creator or board owner only.

**Response**: `204 No Content`.

---

### `PATCH /cards/:cardId/move`
Move card to a different column (or reorder within same column).

**Request body**:
```ts
{
  columnId: string;    // target column (can be same as current)
  position: number;    // new 0-indexed position within target column
}
```

**Response `data`**:
```ts
{ id: string; columnId: string; position: number; updatedAt: string }
```

**Errors**:
| Code | Message |
|---|---|
| `NOT_FOUND` | Target column not found or not on this board |

---

### `PATCH /cards/:cardId/assign`
Assign or unassign a member to a card.

**Request body**:
```ts
{ assigneeId: string | null }  // null = unassign
```

**Response `data`**:
```ts
{
  id: string;
  assignee: { userId: string; displayName: string; avatarUrl: string | null } | null;
  updatedAt: string;
}
```

**Errors**:
| Code | Message |
|---|---|
| `FORBIDDEN` | Target user is not a member of the board |

---

### `POST /cards/:cardId/comments`
Post a comment on a card.

**Request body**:
```ts
{ body: string }  // 1–2 000 chars
```

**Response `data`** (`201 Created`):
```ts
{
  id: string; cardId: string;
  authorId: string; authorName: string; authorAvatar: string | null;
  body: string; createdAt: string;
}
```

---

### `DELETE /cards/:cardId/comments/:commentId`
Delete a comment. Author or board owner only.

**Response**: `204 No Content`.

---

## Activity

### `GET /boards/:boardId/activity`
Get the activity log for a board.

**Query params**: `limit` (default 50, max 100), `before` (ISO timestamp cursor for pagination).

**Response `data`**:
```ts
{
  events: Array<{
    id: string;
    eventType: string;
    actor: { userId: string; displayName: string; avatarUrl: string | null };
    cardId: string | null;
    cardTitle: string | null;
    fromColumn: string | null;   // column name snapshot
    toColumn: string | null;     // column name snapshot
    createdAt: string;
  }>;
  nextCursor: string | null;     // ISO timestamp for next page
}
```

---

## Error Codes Reference

| Code | HTTP Status |
|---|---|
| `VALIDATION_ERROR` | 422 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `CONFIRMATION_REQUIRED` | 409 |
| `INTERNAL_ERROR` | 500 |
