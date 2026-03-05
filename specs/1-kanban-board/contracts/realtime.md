# Realtime Contract: Kanban Board

**Date**: 2026-03-04 | **Plan**: [../plan.md](../plan.md)  
**Transport**: Supabase Realtime (WebSocket — Postgres CDC)  
**Client**: `@supabase/supabase-js` v2 — `supabase.channel(name).on('postgres_changes', …)`

---

## Overview

The client opens **one channel per board** and subscribes to four table change streams. All
events arrive as Supabase `RealtimePostgresChangesPayload<T>` objects. The client-side
`useRealtimeBoard` hook processes incoming events and calls the appropriate Zustand store
actions plus TanStack Query `queryClient.setQueryData` patches.

---

## Connection Lifecycle

```
Client                          Supabase Realtime
  │                                   │
  │── subscribe(boardChannels) ───────>│
  │<─ SUBSCRIBED ─────────────────────│
  │                                   │
  │  [mutation happens in DB]         │
  │<─ postgres_changes event ─────────│
  │                                   │
  │── unsubscribe() ──────────────────>│  (on board unmount)
```

**Disconnection handling**:
- Supabase JS client emits `channel.on('system', { status: 'CHANNEL_ERROR' | 'TIMED_OUT' })`.
- On `CHANNEL_ERROR` or `TIMED_OUT`: set `uiStore.disconnected = true`; display banner.
- On reconnect (`status === 'SUBSCRIBED'` again): set `disconnected = false`; call
  `queryClient.invalidateQueries({ queryKey: ['board', boardId] })` to reconcile missed events.

---

## Channels & Subscriptions

### Channel: `board:{boardId}`

A single multiplexed channel combining all four subscriptions using separate `.on()` calls:

```ts
supabase
  .channel(`board:${boardId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
    handleColumnChange)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` },
    handleCardChange)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
    handleCommentChange)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'activity_events', filter: `board_id=eq.${boardId}` },
    handleActivityChange)
  .subscribe()
```

---

## Event Payloads

### `columns` events

**Event types**: `INSERT`, `UPDATE`, `DELETE`

```ts
// INSERT & UPDATE — payload.new
{
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
}

// DELETE — payload.old (only id guaranteed under default replica identity)
{ id: string }
```

**Client handling**:
- `INSERT` → append column to Zustand `boardStore.columns`; `queryClient.setQueryData` patch.
- `UPDATE` → merge updated column fields by `id`.
- `DELETE` → remove column and all its cards from store by `id`.

---

### `cards` events

**Event types**: `INSERT`, `UPDATE`, `DELETE`

```ts
// INSERT & UPDATE — payload.new
{
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// DELETE — payload.old
{ id: string; column_id: string }
```

**Client handling**:
- `INSERT` → append card to `boardStore.cardsByColumn[column_id]`.
- `UPDATE (column_id changed)` → remove card from old column, add to new column at `position`;
  only apply if `payload.new.updated_at` > locally held `updated_at` (stale-event guard).
- `UPDATE (column_id same)` → merge fields; re-sort column cards by `position`.
- `DELETE` → remove card from its column in store.

**Conflict guard** (concurrent drag-and-drop):
```ts
if (incoming.updated_at <= localCard.updated_at) return; // discard stale event
```

---

### `comments` events

**Event types**: `INSERT`, `DELETE`

```ts
// INSERT — payload.new
{
  id: string;
  card_id: string;
  board_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

// DELETE — payload.old
{ id: string; card_id: string }
```

**Client handling**:
- `INSERT` → if card detail panel for `card_id` is open, append comment to
  `queryClient.setQueryData(['card', card_id, 'comments'], ...)`.
- `DELETE` → remove comment by `id` from the same cache entry.

---

### `activity_events` events

**Event types**: `INSERT` only (append-only table)

```ts
// INSERT — payload.new
{
  id: string;
  board_id: string;
  actor_id: string;
  event_type: string;
  card_id: string | null;
  card_title_snapshot: string | null;
  from_column_name: string | null;
  to_column_name: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}
```

**Client handling**:
- Prepend to `queryClient.setQueryData(['board', boardId, 'activity'], ...)` list.
- Trim list to latest 50 entries client-side to match the display limit.

---

## Zustand ↔ Realtime Integration Pattern

```ts
// useRealtimeBoard.ts (simplified)
export function useRealtimeBoard(boardId: string) {
  const { patchCard, removeCard, addCard, setDisconnected } = useBoardStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` },
        (payload) => {
          // 1. Update Zustand store for instant UI
          if (payload.eventType === 'DELETE') removeCard(payload.old.id);
          else if (payload.eventType === 'INSERT') addCard(payload.new);
          else patchCard(payload.new);  // UPDATE

          // 2. Invalidate TanStack Query cache (background refetch for full consistency)
          queryClient.invalidateQueries({ queryKey: ['board', boardId, 'cards'] });
        })
      .on('system', {}, ({ status }) => {
        setDisconnected(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT');
        if (status === 'SUBSCRIBED') {
          // Reconnected — full re-fetch to catch missed events
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardId]);
}
```

---

## Latency Budget

| Step | Target |
|---|---|
| DB trigger → Supabase Realtime broadcast | ≤ 200 ms |
| WebSocket delivery to client | ≤ 300 ms |
| Zustand store patch → React re-render | ≤ 50 ms |
| **Total end-to-end** | **≤ 550 ms** (well within the 1 s requirement) |
