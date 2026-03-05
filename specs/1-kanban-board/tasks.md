# Tasks: Kanban Board for Small Teams

**Input**: Design documents from `/specs/1-kanban-board/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US6 from spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — zero application logic, just tooling scaffolding.

- [ ] T001 Bootstrap Next.js 14 project with TypeScript strict mode: `npx create-next-app@latest --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [ ] T002 Install all core dependencies: `@supabase/supabase-js @supabase/ssr zustand @tanstack/react-query @tanstack/react-query-devtools @hello-pangea/dnd zod`
- [ ] T003 [P] Install dev/test dependencies: `vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom playwright @playwright/test`
- [ ] T004 [P] Configure `vitest.config.ts` with jsdom environment, coverage thresholds (≥ 80 %), and path aliases mirroring `tsconfig.json`
- [ ] T005 [P] Configure `playwright.config.ts` with `baseURL: http://localhost:3000`, webServer block, and `tests/e2e/` testDir
- [ ] T006 [P] Configure `tailwind.config.ts` with content paths covering `app/**` and `src/**`
- [ ] T007 [P] Configure ESLint (Next.js rules + `@typescript-eslint/no-explicit-any` as error) in `eslint.config.mjs`
- [ ] T008 Add pnpm scripts to `package.json`: `test`, `test:watch`, `test:coverage`, `test:e2e`, `db:reset`, `db:push`
- [ ] T009 Create `supabase/` directory; run `supabase init`; commit `supabase/config.toml`
- [ ] T010 Create `.env.local.example` with all required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Checkpoint ✅**: `pnpm dev` starts, `pnpm test` runs (0 tests, no failures), `supabase start` succeeds.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure every user story depends on. **No US work starts until this phase is done.**

### Database Migrations

- [ ] T011 Create migration `supabase/migrations/001_profiles.sql`: `profiles` table (id, display_name, email, avatar_url, created_at) + trigger to auto-insert from `auth.users` on sign-up
- [ ] T012 Create migration `supabase/migrations/002_boards.sql`: `boards` table + `board_members` join table + unique constraint `(board_id, user_id)` + `updated_at` moddatetime trigger
- [ ] T013 Create migration `supabase/migrations/003_columns_cards.sql`: `columns` table + `cards` table (with `board_id` denorm column) + `moddatetime` trigger on `cards.updated_at`
- [ ] T014 Create migration `supabase/migrations/004_comments.sql`: `comments` table (with `board_id` denorm)
- [ ] T015 Create migration `supabase/migrations/005_activity_events.sql`: `activity_events` append-only table + `event_type` CHECK constraint + Postgres triggers on `cards`, `comments`, `board_members`
- [ ] T016 Create migration `supabase/migrations/006_indexes.sql`: all indexes from data-model.md (board_members, columns position, cards column position, comments card/time, activity board/time)
- [ ] T017 Create migration `supabase/migrations/007_rls.sql`: enable RLS on all tables + `is_board_member()` security-definer function + all RLS policies per data-model.md
- [ ] T018 Create migration `supabase/migrations/008_realtime.sql`: enable Realtime publication for `columns`, `cards`, `comments`, `activity_events` tables
- [ ] T019 Create `supabase/seed.sql` with two test users, one board, three default columns, and five sample cards
- [ ] T020 Run `supabase db reset` and verify all migrations apply cleanly; commit working migration set

### Supabase Client & Auth Infrastructure

- [ ] T021 [P] Create `src/lib/supabase/client.ts`: `createBrowserClient` singleton (client components)
- [ ] T022 [P] Create `src/lib/supabase/server.ts`: `createServerClient` factory using Next.js `cookies()` (Route Handlers + RSC)
- [ ] T023 Create `src/middleware.ts`: Supabase session refresh middleware (`updateSession`) with protected route matchers for `/boards/*`
- [ ] T024 Create `src/types/index.ts`: TypeScript interfaces for `Profile`, `Board`, `BoardMember`, `Column`, `Card`, `Comment`, `ActivityEvent`, `ApiResponse<T>` envelope

### API Helpers & Shared Services

- [ ] T025 [P] Create `src/lib/api.ts`: `apiResponse<T>(data, meta?)` and `apiError(code, message, status)` helper functions enforcing the `{ data, error, meta }` envelope
- [ ] T026 [P] Create `src/lib/validators/boardSchemas.ts`: Zod schemas for `CreateBoardInput`, `UpdateBoardInput` — enforce name 1–100 chars
- [ ] T027 [P] Create `src/lib/validators/columnSchemas.ts`: Zod schemas for `CreateColumnInput`, `UpdateColumnInput` — name 1–50 chars
- [ ] T028 [P] Create `src/lib/validators/cardSchemas.ts`: Zod schemas for `CreateCardInput`, `UpdateCardInput`, `MoveCardInput`, `AssignCardInput` — title 1–255, description max 5000, body 1–2000

### Zustand Stores & Providers

- [ ] T029 [P] Create `src/store/boardStore.ts`: Zustand store with state `{ columns, cardsByColumn }` and actions `addCard`, `patchCard`, `removeCard`, `patchColumn`, `removeColumn`
- [ ] T030 [P] Create `src/store/uiStore.ts`: Zustand store with state `{ activeCardId, disconnected }` and actions `openCard`, `closeCard`, `setDisconnected`
- [ ] T031 Create `app/layout.tsx`: root layout wrapping children with `QueryClientProvider` (TanStack Query), render `<Providers>` client component
- [ ] T032 Create `src/components/Providers.tsx`: client component housing `QueryClientProvider`, `ReactQueryDevtools` (dev only)

### Auth Pages

- [ ] T033 Create `app/(auth)/login/page.tsx`: Supabase Auth UI email+password sign-in form; redirects to `/` on success
- [ ] T034 Create `app/(auth)/register/page.tsx`: Supabase Auth UI sign-up form; creates profile row on success via `/api/v1/auth/callback`
- [ ] T035 Create `app/api/auth/callback/route.ts`: Supabase Auth callback Route Handler (exchanges code for session)

**Checkpoint ✅**: Auth flow works end-to-end (sign-up → login → redirect to `/`); `supabase db reset` succeeds; RLS rejects unauthenticated requests.

---

## Phase 3: User Story 1 — Board & Column Setup (Priority: P1) 🎯 MVP Start

**Goal**: Authenticated users can create a board, see three default columns, rename/delete boards, and share the board URL with team members.

**Independent Test**: Sign in → "Create Board" → board page shows "To Do / In Progress / Done" columns. Share URL with second session → visible.

### API — Boards & Columns

- [ ] T036 [US1] Create `app/api/v1/boards/route.ts`: `GET` (list user boards) + `POST` (create board + seed 3 columns + insert owner in `board_members`) using `src/lib/supabase/server.ts` and `boardSchemas`
- [ ] T037 [US1] Create `app/api/v1/boards/[boardId]/route.ts`: `GET` (full board with columns + cards + members) + `PATCH` (rename, owner only) + `DELETE` (cascade, owner only)
- [ ] T038 [US1] Create `app/api/v1/boards/[boardId]/members/route.ts`: `GET` (list members) + `POST` (invite by email) + `DELETE /[userId]` (remove member, owner only)
- [ ] T039 [US1] Create `app/api/v1/columns/route.ts`: `POST` (create column in board)
- [ ] T040 [US1] Create `app/api/v1/columns/[columnId]/route.ts`: `PATCH` (rename) + `DELETE` (with `?confirm=true` guard)

### Service & Hook Layer

- [ ] T041 [US1] Create `src/services/boardService.ts`: `getBoards()`, `createBoard()`, `getBoard()`, `updateBoard()`, `deleteBoard()`, `inviteMember()`, `removeMember()` — typed fetch wrappers
- [ ] T042 [US1] Create `src/services/columnService.ts`: `createColumn()`, `updateColumn()`, `deleteColumn()`
- [ ] T043 [US1] Create `src/hooks/useBoard.ts`: TanStack Query `useQuery` for board detail + `useMutation` for create/update/delete board; invalidates `['boards']` and `['board', id]` keys
- [ ] T044 [US1] Create `src/hooks/useColumns.ts`: `useMutation` for create/rename/delete column; invalidates `['board', boardId]`

### UI Components

- [ ] T045 [P] [US1] Create `src/components/ui/Button.tsx`, `Input.tsx`, `Modal.tsx`, `Badge.tsx`, `Avatar.tsx` — Tailwind-styled generic atoms, fully typed props
- [ ] T046 [P] [US1] Create `src/components/board/KanbanColumn.tsx`: renders column header (name, card count, rename/delete actions) + card slot area; accepts `column` and `cards` props
- [ ] T047 [US1] Create `src/components/board/KanbanBoard.tsx`: renders ordered `KanbanColumn` list from `boardStore`; wraps with `DragDropContext` placeholder (wired in US3)
- [ ] T048 [US1] Create `app/page.tsx`: board list page — calls `useBoard` (list), renders board cards with "Create Board" modal trigger
- [ ] T049 [US1] Create `app/boards/[boardId]/page.tsx`: board view page — server-side fetch of initial board data via RSC, hands off to `KanbanBoard` client component; registers `useRealtimeBoard` subscription stub
- [ ] T050 [US1] Create `src/components/board/CreateBoardModal.tsx`: form (name input + submit); calls `createBoard` mutation; closes on success + navigates to new board

**Checkpoint ✅ US1**: Create board → 3 columns visible. Rename board. Delete board. Invite member by email → second session can view. All without cards.

---

## Phase 4: User Story 2 — Card Creation & Management (Priority: P1)

**Goal**: Members can add, edit, and delete cards within any column, visible immediately to all board viewers.

**Independent Test**: Add card to "To Do" → verify in second session. Edit title. Delete card. All without drag-and-drop.

### API — Cards

- [ ] T051 [US2] Create `app/api/v1/cards/route.ts`: `POST` (create card, sets `position = max + 1` within column)
- [ ] T052 [US2] Create `app/api/v1/cards/[cardId]/route.ts`: `GET` (card detail + comments) + `PATCH` (update title/description) + `DELETE` (creator or owner only)

### Service & Hook Layer

- [ ] T053 [US2] Create `src/services/cardService.ts`: `createCard()`, `getCard()`, `updateCard()`, `deleteCard()` — typed fetch wrappers
- [ ] T054 [US2] Create `src/hooks/useCards.ts`: `useQuery` for card detail; `useMutation` for create/update/delete with optimistic updates; invalidates `['board', boardId, 'cards']`

### UI Components

- [ ] T055 [P] [US2] Create `src/components/board/KanbanCard.tsx`: card thumbnail component — shows title, assignee avatar (empty for now), truncated description; accepts `card` prop
- [ ] T056 [P] [US2] Create `src/components/card/AddCardForm.tsx`: inline form (title input + optional description + submit/cancel); shown at bottom of `KanbanColumn` on "+ Add Card" click
- [ ] T057 [US2] Create `src/components/card/CardDetailPanel.tsx`: slide-over panel showing full card (title edit, description edit, assignee placeholder, comment placeholder); opens from card thumbnail click
- [ ] T058 [US2] Wire `KanbanColumn` to render `KanbanCard` list + `AddCardForm`; wire `KanbanCard` click to open `CardDetailPanel` via `uiStore.openCard`
- [ ] T059 [US2] Wire `CardDetailPanel` delete action to `deleteCard` mutation (show confirmation dialog for non-owner)

### Real-time (Cards)

- [ ] T060 [US2] Create `src/hooks/useRealtimeBoard.ts`: Supabase Realtime channel `board:{boardId}` — subscribe to `cards` table changes; dispatch `boardStore.addCard / patchCard / removeCard` on INSERT/UPDATE/DELETE; handle system events for `disconnected` flag in `uiStore`

**Checkpoint ✅ US2**: Add card → appears in second session < 1 s. Edit title. Delete card. "Disconnected" banner shown when Supabase WS is severed.

---

## Phase 5: User Story 3 — Drag-and-Drop Status Change (Priority: P1) 🎯 MVP

**Goal**: Members drag cards between columns; moves persist and sync to all sessions within 1 s.

**Independent Test**: Drag card from "To Do" to "In Progress" → second session sees moved card < 1 s. Concurrent drag resolves correctly.

### API — Card Move

- [ ] T061 [US3] Create `app/api/v1/cards/[cardId]/move/route.ts`: `PATCH` — validate `MoveCardInput` (columnId, position); update `cards.column_id` + `cards.position`; reorder sibling positions in target column atomically

### Service Layer

- [ ] T062 [US3] Add `moveCard(cardId, columnId, position)` to `src/services/cardService.ts`

### Hook — Optimistic Move

- [ ] T063 [US3] Create `src/hooks/useCardMutations.ts`: `useMoveCard` mutation with TanStack Query `onMutate` optimistic update (immediately reorder `boardStore` columns) + `onError` rollback + `onSettled` invalidate `['board', boardId, 'cards']`

### Drag-and-Drop UI

- [ ] T064 [US3] Wrap `KanbanBoard` in `<DragDropContext onDragEnd={…}>` using `@hello-pangea/dnd`; implement `onDragEnd` to call `useMoveCard` mutation with new `columnId` + `position`
- [ ] T065 [US3] Wrap each `KanbanColumn` card list in `<Droppable droppableId={column.id}>` and each `KanbanCard` in `<Draggable draggableId={card.id} index={position}>`
- [ ] T066 [US3] Add visual drag affordance styling in `KanbanCard.tsx`: drag handle icon, `isDragging` Tailwind shadow class, column `isDraggingOver` highlight

### Real-time — Stale-event Guard

- [ ] T067 [US3] Update `useRealtimeBoard.ts` cards UPDATE handler: discard incoming event if `payload.new.updated_at <= localCard.updatedAt` (stale-event conflict guard per realtime.md)

**Checkpoint ✅ US3 = MVP**: Full Kanban workflow functional. Create board → add cards → drag between columns → real-time sync visible in two browser tabs.

---

## Phase 6: User Story 4 — Assignee & Card Details (Priority: P2)

**Goal**: Members assign a responsible person to a card; assignee name/avatar shows on card thumbnail.

**Independent Test**: Open card detail → assign member → close panel → assignee avatar visible on thumbnail → reopen → assignee still set.

### API — Assign

- [ ] T068 [US4] Create `app/api/v1/cards/[cardId]/assign/route.ts`: `PATCH` — validate `AssignCardInput` (assigneeId | null); verify assignee is a board member; update `cards.assignee_id`

### Service & Hook Layer

- [ ] T069 [US4] Add `assignCard(cardId, assigneeId | null)` to `src/services/cardService.ts`
- [ ] T070 [US4] Add `useAssignCard` mutation to `src/hooks/useCardMutations.ts`; optimistic update to `boardStore` `assignee_id`; invalidates card detail query

### UI Components

- [ ] T071 [P] [US4] Create `src/components/card/AssigneePicker.tsx`: dropdown listing board members (display_name + Avatar); calls `useAssignCard`; shows "Unassigned" option; accessible via keyboard
- [ ] T072 [US4] Update `KanbanCard.tsx`: render `<Avatar>` and `displayName` when `card.assignee` is set (empty state for unassigned cards)
- [ ] T073 [US4] Mount `AssigneePicker` inside `CardDetailPanel.tsx`; pre-select current assignee if set

### Real-time (Assignee Updates)

- [ ] T074 [US4] Update `useRealtimeBoard.ts` cards UPDATE handler: when `assignee_id` changes, patch `boardStore` card so thumbnail updates without full refetch

**Checkpoint ✅ US4**: Assign member → thumbnail updates immediately → second session sees avatar < 1 s.

---

## Phase 7: User Story 5 — Comments on Cards (Priority: P2)

**Goal**: Members post plain-text comments on cards; all viewers see them in chronological order with real-time delivery.

**Independent Test**: Post comment from session A → appears in open CardDetailPanel in session B < 1 s. Delete own comment. Cannot delete others'.

### API — Comments

- [ ] T075 [US5] Create `app/api/v1/cards/[cardId]/comments/route.ts`: `POST` (create comment, validate body 1–2000 chars); returns created comment with author profile join
- [ ] T076 [US5] Create `app/api/v1/cards/[cardId]/comments/[commentId]/route.ts`: `DELETE` (author or board owner only; 403 otherwise)

### Service & Hook Layer

- [ ] T077 [US5] Create `src/services/commentService.ts`: `addComment(cardId, body)`, `deleteComment(cardId, commentId)`
- [ ] T078 [US5] Create `src/hooks/useComments.ts`: `useQuery` for comment list keyed `['card', cardId, 'comments']`; `useMutation` for add (optimistic append) + delete (optimistic remove); invalidates on settle

### UI Components

- [ ] T079 [P] [US5] Create `src/components/card/CommentList.tsx`: renders comments in ascending `created_at` order; each shows Avatar, `displayName`, relative timestamp, and body; delete button shown only for own comments
- [ ] T080 [P] [US5] Create `src/components/card/AddCommentForm.tsx`: textarea (1–2000 chars) + submit; shows character counter; clears on success; blocks empty submit
- [ ] T081 [US5] Mount `CommentList` + `AddCommentForm` in `CardDetailPanel.tsx`

### Real-time (Comments)

- [ ] T082 [US5] Extend `useRealtimeBoard.ts`: subscribe to `comments` table INSERT/DELETE filtered by `board_id`; on INSERT — if `CardDetailPanel` is open for that `card_id`, call `queryClient.setQueryData` to append; on DELETE — remove by id

**Checkpoint ✅ US5**: Post comment → second session sees it < 1 s. Delete own comment → gone. Cannot delete other's comment.

---

## Phase 8: User Story 6 — Activity Log (Priority: P3)

**Goal**: Members view a chronological feed of the last 50 board events (card created/moved/assigned/commented) with real-time updates.

**Independent Test**: Perform create + move + assign + comment on a card → open Activity Log → all four events appear in correct order < 2 s. New events appear without page refresh.

### API — Activity

- [ ] T083 [US6] Create `app/api/v1/boards/[boardId]/activity/route.ts`: `GET` — query `activity_events` ordered by `created_at DESC LIMIT 50`; join `profiles` (actor display_name, avatar_url); support `?before=` cursor for pagination; return `nextCursor`

### Service & Hook Layer

- [ ] T084 [US6] Create `src/services/activityService.ts`: `getActivity(boardId, cursor?)` fetch wrapper
- [ ] T085 [US6] Create `src/hooks/useActivity.ts`: `useInfiniteQuery` keyed `['board', boardId, 'activity']`; page size 50; fetches next page via `nextCursor`

### UI Components

- [ ] T086 [P] [US6] Create `src/components/activity/ActivityLog.tsx`: scrollable list of events; each entry renders human-readable text (e.g., "Alice moved 'Design mockup' to In Progress") + relative timestamp; "Load more" button when `nextCursor` present
- [ ] T087 [US6] Create `app/boards/[boardId]/activity/page.tsx`: Activity Log page rendering `<ActivityLog boardId={boardId} />`; add "Activity" link in board header

### Real-time (Activity)

- [ ] T088 [US6] Extend `useRealtimeBoard.ts`: subscribe to `activity_events` INSERT; prepend to `['board', boardId, 'activity']` TanStack Query cache; trim client list to 50 entries

**Checkpoint ✅ US6**: Open Activity Log → last 50 events shown. Perform action → new entry appears at top without refresh.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Production readiness, accessibility, and Vercel deployment.

- [ ] T089 [P] Implement `DisconnectedBanner` component in `src/components/ui/DisconnectedBanner.tsx`; mount in `app/boards/[boardId]/page.tsx`; driven by `uiStore.disconnected`
- [ ] T090 [P] Add WCAG 2.1 AA accessibility audit: verify keyboard navigation for drag-and-drop (`@hello-pangea/dnd` keyboard mode), focus management in `CardDetailPanel` modal, ARIA labels on icon-only buttons
- [ ] T091 [P] Add loading skeleton components (`src/components/ui/Skeleton.tsx`) for board columns and card lists; render during TanStack Query `isLoading` states
- [ ] T092 [P] Add empty-state UI in `KanbanColumn.tsx`: "No tasks yet — click + to add one" when column has zero cards
- [ ] T093 Add `app/not-found.tsx` and `app/error.tsx` global error boundaries
- [ ] T094 Run `pnpm test:coverage` — confirm all modules ≥ 80 %; add missing unit tests for `src/lib/validators/`, `src/lib/api.ts`, `src/store/` actions
- [ ] T095 Run `pnpm test:e2e` — confirm Playwright happy-path tests pass for US1–US6
- [ ] T096 Create `.github/workflows/ci.yml`: on PR → `pnpm lint`, `pnpm test:coverage`, `pnpm build`; block merge if any step fails
- [ ] T097 Configure Vercel project: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; enable Realtime on production Supabase tables; run `supabase db push` for production schema
- [ ] T098 Validate `specs/1-kanban-board/quickstart.md`: run full setup from scratch on clean machine; update any outdated steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No deps — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 only — no other story deps
- **Phase 4 (US2)**: Depends on Phase 2 + Phase 3 board/column API (cards need a column to live in)
- **Phase 5 (US3)**: Depends on Phase 4 (cards must exist to drag)
- **Phase 6 (US4)**: Depends on Phase 4 (needs card detail + member list)
- **Phase 7 (US5)**: Depends on Phase 4 (comments live on cards); independent of US4
- **Phase 8 (US6)**: Depends on Phases 3–7 (activity triggers need cards/comments data)
- **Phase 9 (Polish)**: Depends on all story phases

### User Story Completion Order

```
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) ← MVP ✅
                                   ↘ Phase 6 (US4) ↗
                                     Phase 7 (US5) ← parallel with US4
                                   ↘ Phase 8 (US6)
                                     Phase 9 (Polish)
```

### Parallel Opportunities Per Phase

**Phase 1**: T003 ‖ T004 ‖ T005 ‖ T006 ‖ T007 can all run in parallel after T002.

**Phase 2 (DB migrations)**: T011→T020 run sequentially (order matters for FK deps). T021 ‖ T022 can run in parallel. T025 ‖ T026 ‖ T027 ‖ T028 ‖ T029 ‖ T030 can all run in parallel.

**Phase 3 (US1)**: T036 ‖ T037 ‖ T038 after T031–T035. T045 ‖ T046 parallel. T041 ‖ T042 ‖ T043 ‖ T044 after APIs.

**Phase 4 (US2)**: T055 ‖ T056 parallel UI work. T051 ‖ T053 parallel API+service.

**Phase 6 (US4)**: T071 (AssigneePicker) in parallel with T068 (API).

**Phase 7 (US5)**: T079 ‖ T080 parallel. Entire Phase 7 can run in parallel with Phase 6.

**Phase 9**: T089 ‖ T090 ‖ T091 ‖ T092 all independent parallel tasks.

---

## Parallel Example: Phase 2 Setup Tasks

```
# After T020 (migrations done):
Parallel batch A — run together:
  T021  src/lib/supabase/client.ts
  T022  src/lib/supabase/server.ts
  T025  src/lib/api.ts

Parallel batch B — run together (no deps on batch A):
  T026  src/lib/validators/boardSchemas.ts
  T027  src/lib/validators/columnSchemas.ts
  T028  src/lib/validators/cardSchemas.ts
  T029  src/store/boardStore.ts
  T030  src/store/uiStore.ts
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (migrations, auth, API helpers, stores)
3. Complete Phase 3: US1 — boards + columns
4. Complete Phase 4: US2 — cards
5. Complete Phase 5: US3 — drag-and-drop
6. **STOP and VALIDATE**: Full Kanban loop works in two tabs
7. Deploy to Vercel preview URL

### Incremental Delivery

| Delivery | Phases | Feature |
|---|---|---|
| MVP | 1–5 | Working Kanban board with real-time sync |
| v1.1 | +6 | Card assignees |
| v1.2 | +7 | Card comments |
| v1.3 | +8, 9 | Activity log + production hardening |

### Parallel Team Strategy (2 developers after Phase 2)

- **Dev A**: Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3)
- **Dev B**: Phase 6 (US4) ‖ Phase 7 (US5) (can start after Phase 4)
- **Both**: Phase 8 (US6) + Phase 9 (Polish)

---

## Task Count Summary

| Phase | Tasks | Notes |
|---|---|---|
| Phase 1 — Setup | T001–T010 | 10 tasks |
| Phase 2 — Foundational | T011–T035 | 25 tasks |
| Phase 3 — US1 Board Setup | T036–T050 | 15 tasks |
| Phase 4 — US2 Cards | T051–T060 | 10 tasks |
| Phase 5 — US3 Drag-and-Drop | T061–T067 | 7 tasks |
| Phase 6 — US4 Assignees | T068–T074 | 7 tasks |
| Phase 7 — US5 Comments | T075–T082 | 8 tasks |
| Phase 8 — US6 Activity Log | T083–T088 | 6 tasks |
| Phase 9 — Polish | T089–T098 | 10 tasks |
| **Total** | **T001–T098** | **98 tasks** |
