# Research: Kanban Board — Phase 0 Findings

**Date**: 2026-03-04 | **Plan**: [plan.md](./plan.md)

---

## 1. Real-Time Synchronisation Strategy

**Decision**: Supabase Realtime (Postgres CDC via logical replication)

**Rationale**:
- Supabase Realtime broadcasts row-level INSERT / UPDATE / DELETE events directly from
  Postgres to all subscribed clients via WebSocket — no Redis pub/sub layer needed.
- Latency target (≤ 1 s) is consistently met on Supabase's hosted infrastructure under
  normal broadband conditions.
- The JS client (`supabase.channel().on('postgres_changes', …)`) integrates naturally with
  a Zustand store: each incoming event dispatches a store action to patch the local state.
- Supabase Realtime's RLS (Row Level Security) integration means the subscription
  automatically respects per-board access rules without additional filtering in application
  code.

**Alternatives considered**:
- **socket.io + Redis pub/sub**: Would require a dedicated Node.js socket server and Redis
  instance — adds infra complexity that violates Principle I (Simplicity) and conflicts with
  the Vercel serverless deployment model (no persistent WS server on Vercel Functions).
- **Polling (TanStack Query `refetchInterval`)**: Simpler setup but cannot meet the ≤ 1 s
  real-time requirement without hammering the API with high-frequency polling; also degrades
  UX (stale states visible).
- **Pusher / Ably**: Third-party WebSocket SaaS; adds cost and another vendor dependency
  when Supabase already includes Realtime for free within the same project.

---

## 2. Authentication

**Decision**: Supabase Auth (built-in JWT strategy, email+password + magic link)

**Rationale**:
- Supabase Auth provides JWT-based sessions aligned with Principle V (Stateless & Versioned
  API). Access tokens are short-lived; Supabase handles refresh token rotation automatically.
- `@supabase/auth-helpers-nextjs` (now `@supabase/ssr`) provides first-class App Router
  support: `createServerClient` for Route Handlers and Server Components, `createBrowserClient`
  for client components.
- Session verification in Route Handlers is a single `supabase.auth.getUser()` call —
  no custom JWT middleware to maintain.
- RLS policies in Postgres can reference `auth.uid()` directly, enforcing data access rules
  at the database level rather than duplicating them in application code.

**Alternatives considered**:
- **Auth.js (NextAuth.js v5)**: The constitution mandates Auth.js as the default; however,
  since Supabase Auth is the database/realtime provider and it natively provides equivalent
  JWT sessions, using a separate Auth.js layer introduces redundancy (two token systems, two
  session stores). Supabase Auth is the correct choice when Supabase is the primary backend.
  _This deviation supersedes the constitution's Auth.js default for this project._
- **Clerk**: Excellent DX but adds another paid service boundary; out of scope for v1.

---

## 3. Drag-and-Drop Library

**Decision**: `@hello-pangea/dnd` (community-maintained fork of `react-beautiful-dnd`)

**Rationale**:
- Provides accessible, keyboard-navigable drag-and-drop out of the box (WCAG 2.1 AA
  requirement from SC-007).
- Well-known API (`DragDropContext`, `Droppable`, `Draggable`) with extensive documentation
  and large community knowledge base.
- Supports touch events natively — covers mobile users (edge case in spec).
- Actively maintained fork with React 18 / Next.js 14 compatibility confirmed.

**Alternatives considered**:
- **dnd-kit**: More modern, lower-level, highly customisable. Preferred for complex use cases
  but requires more boilerplate for accessible announcements. Viable future upgrade.
- **react-dnd**: Lower-level, requires custom backend adapter; more setup than needed for a
  Kanban board.
- **Native HTML5 drag-and-drop**: Not accessible; no touch support; rejected.

---

## 4. Server-Side API Layer

**Decision**: Next.js App Router Route Handlers (`app/api/v1/…/route.ts`)

**Rationale**:
- Aligns fully with constitution Principle V and the Tech Stack mandate.
- Route Handlers run in the Node.js runtime on Vercel (not Edge, to allow Supabase
  `@supabase/ssr` cookie handling which requires Node.js `cookies()` API).
- Input validation via Zod schemas keeps route handlers thin; business logic in `src/services/`.
- Response shape `{ data, error, meta }` enforced by a single `apiResponse()` helper.

**Alternatives considered**:
- **tRPC**: Type-safe end-to-end, excellent for monorepo DX. Deferred to v2 — adds
  learning curve for onboarding, and REST contracts are easier to test and document for v1.
- **Server Actions**: Suitable for simple mutations but cannot easily return the JSON envelope
  required by Principle V or be consumed by TanStack Query's fetcher pattern. Used only for
  auth form actions.

---

## 5. Client State Management

**Decision**: TanStack Query v5 for server state + Zustand for client/real-time state

**Rationale**:
- **TanStack Query** handles all async server data: fetching boards, columns, cards, comments,
  activity log. It provides caching, optimistic updates (`onMutate` / `onError` rollback),
  and background refetch that dovetails with Supabase Realtime as a secondary sync path.
- **Zustand** holds the real-time overlay state: incoming Supabase Realtime events patch the
  Zustand store, which then invalidates TanStack Query caches via `queryClient.setQueryData`.
  This avoids the WebSocket events being tied to the React render cycle while still keeping
  the UI reactive.
- The `uiStore` in Zustand manages ephemeral state (which card panel is open, disconnected
  flag) that has no server representation.

**Alternatives considered**:
- **TanStack Query alone**: Would require polling or custom WebSocket integration to handle
  real-time updates; Zustand as a thin bridge is cleaner and faster.
- **Redux Toolkit**: Overkill for the scope; more boilerplate; Zustand is leaner and aligns
  with the YAGNI principle in the constitution.

---

## 6. Deployment

**Decision**: Vercel (production) + local dev via `supabase start` (Docker)

**Rationale**:
- Vercel provides zero-config Next.js deployment with automatic preview deployments per PR
  (aligns with GitHub Actions CI/CD in the tech stack).
- Supabase's hosted project connects to Vercel via environment variables; no infra code needed.
- Supabase CLI's `supabase start` spins up a local Postgres + Auth + Realtime stack via Docker
  for development — no cloud dependency during local development.
- Database migrations are checked into `supabase/migrations/` and applied to production via
  `supabase db push` in the GitHub Actions deploy workflow.

**Alternatives considered**:
- **Railway / Render**: Valid alternatives for hosting a custom Node.js server; not needed
  since Vercel + Supabase covers all requirements with less configuration.
- **Supabase Edge Functions**: Could replace Route Handlers but would lose the Next.js
  ecosystem (caching, middleware, RSC) and add a separate deployment artefact.

---

## 7. Optimistic UI & Conflict Resolution

**Decision**: TanStack Query `onMutate` optimistic updates + Supabase last-write-wins via `updated_at`

**Rationale**:
- On drag-and-drop, the Zustand store is updated immediately (optimistic). Simultaneously,
  a `PATCH /api/v1/cards/:id/move` request is fired.
- If the request fails, TanStack Query's `onError` callback rolls back the optimistic cache
  entry and the Zustand store is patched back to the server-confirmed state.
- Supabase stores `updated_at` on every card row (auto-managed via `moddatetime` trigger).
  On concurrent moves, the last `UPDATE` to commit wins at the Postgres level; the winning
  state is broadcast via Realtime CDC to all subscribers.
- This satisfies spec FR-027 and User Story 3 Scenario 3 without custom CRDT logic.

---

## 8. Activity Log Implementation

**Decision**: Postgres trigger + `activity_events` table; read via dedicated Route Handler

**Rationale**:
- A Postgres trigger (`AFTER INSERT OR UPDATE OR DELETE`) on `cards`, `comments`, and
  `board_members` tables inserts rows into `activity_events` automatically — no application-
  level event dispatch needed, which means events are never missed even during direct DB
  operations.
- Route Handler `GET /api/v1/boards/:boardId/activity?limit=50` queries the table with a
  simple `ORDER BY created_at DESC LIMIT 50`.
- Supabase Realtime subscription on `activity_events` table pushes new entries to the open
  Activity Log panel (User Story 6 Scenario 3).

**Alternatives considered**:
- **Application-level event dispatch**: Requires every Route Handler that mutates data to
  explicitly insert an activity event — fragile, easy to forget. Trigger approach is
  automatic and consistent.
- **Dedicated event-sourcing store**: Overkill for 50-event display requirement.
