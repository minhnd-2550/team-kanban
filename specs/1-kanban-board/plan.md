# Implementation Plan: Kanban Board for Small Teams

**Branch**: `1-kanban-board` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/1-kanban-board/spec.md`

---

## Summary

Build a real-time collaborative Kanban board (To Do / In Progress / Done) for small teams
using a **Next.js 14+ App Router fullstack** architecture deployed on Vercel. Users can
create Boards, manage Columns and Cards, drag-and-drop cards across columns, assign
members, post comments, and view an Activity Log. Real-time synchronisation is powered by
**Supabase Realtime** (Postgres CDC). All server logic lives in Next.js Route Handlers and
Server Components — no separate backend service.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict mode; `any` forbidden)  
**Primary Dependencies**: Next.js 14 (App Router), Tailwind CSS, Zustand, TanStack Query v5,
Supabase JS v2 (`@supabase/supabase-js`), `@supabase/auth-helpers-nextjs`, Zod,
`@hello-pangea/dnd` (drag-and-drop), Vitest + React Testing Library, Playwright  
**Storage**: Supabase (hosted PostgreSQL) + Supabase Storage (avatars, optional)  
**Testing**: Vitest (unit/component), Playwright (E2E)  
**Target Platform**: Web — Vercel Edge / Node.js runtime  
**Project Type**: Fullstack web application (Next.js monorepo, single project)  
**Performance Goals**: Board interactive < 3 s (200 cards), card move ≤ 1 s real-time sync  
**Constraints**: < 200 ms p95 API response (Route Handlers, Vercel edge), WCAG 2.1 AA  
**Scale/Scope**: Small teams 2–10 members; up to ~200 cards/board; 10 concurrent sessions

---

## Constitution Check

*Gates evaluated against `constitution.md` v1.1.0. Must pass before Phase 0. Re-checked
after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. User-Centric Simplicity | ✅ PASS | Three-column canonical view; no extra screens |
| II. Real-Time Collaboration | ✅ PASS | Supabase Realtime CDC; optimistic UI via Zustand; disconnected indicator planned |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | Vitest unit ≥ 80 %; Playwright E2E per story; TDD cycle enforced in workflow |
| IV. Component-Based Frontend Architecture | ✅ PASS | `src/components/` shared; `app/` App Router pages; no `any`; logic in hooks/services |
| V. Stateless & Versioned API Design | ✅ PASS | `app/api/v1/` Route Handlers; Auth.js JWT (Supabase handles token); versioned from day one |

**Technology Stack compliance**: Next.js 14, Tailwind CSS, Zustand, TypeScript — all mandated.
Supabase replaces the PostgreSQL + Redis combination from the constitution; Auth.js is
superseded by Supabase Auth (equivalent JWT strategy) — see `research.md` for rationale.

> No gate violations. No complexity justification required.

---

## Project Structure

### Documentation (this feature)

```text
specs/1-kanban-board/
├── plan.md          ← this file
├── research.md      ← Phase 0 output
├── data-model.md    ← Phase 1 output
├── quickstart.md    ← Phase 1 output
├── contracts/
│   ├── rest-api.md  ← Phase 1 output
│   └── realtime.md  ← Phase 1 output
└── tasks.md         ← Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

Next.js single-project layout (App Router):

```text
teamkanban/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers: QueryClient, Supabase session)
│   ├── page.tsx                  # Home / board list
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── boards/
│   │   └── [boardId]/
│   │       ├── page.tsx          # Board view (columns + cards)
│   │       └── activity/page.tsx # Activity Log panel
│   └── api/
│       └── v1/
│           ├── boards/
│           │   ├── route.ts           # GET list, POST create
│           │   └── [boardId]/
│           │       ├── route.ts       # GET, PATCH, DELETE
│           │       ├── members/route.ts
│           │       └── activity/route.ts
│           ├── columns/
│           │   ├── route.ts
│           │   └── [columnId]/route.ts
│           └── cards/
│               ├── route.ts
│               └── [cardId]/
│                   ├── route.ts
│                   ├── move/route.ts
│                   ├── assign/route.ts
│                   └── comments/route.ts
│
├── src/
│   ├── components/               # Shared UI components
│   │   ├── board/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanCard.tsx
│   │   ├── card/
│   │   │   ├── CardDetailPanel.tsx
│   │   │   ├── AddCardForm.tsx
│   │   │   ├── CommentList.tsx
│   │   │   └── AssigneePicker.tsx
│   │   ├── activity/
│   │   │   └── ActivityLog.tsx
│   │   └── ui/                   # Generic atoms: Button, Input, Modal, Badge, Avatar
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useBoard.ts           # TanStack Query: fetch/mutate board
│   │   ├── useColumns.ts
│   │   ├── useCards.ts
│   │   ├── useCardMutations.ts
│   │   ├── useComments.ts
│   │   ├── useActivity.ts
│   │   └── useRealtimeBoard.ts   # Supabase Realtime subscription + Zustand sync
│   │
│   ├── store/                    # Zustand stores (client state only)
│   │   ├── boardStore.ts         # Active board state (columns, cards, order)
│   │   └── uiStore.ts            # UI state (active card panel, disconnected flag)
│   │
│   ├── services/                 # API client functions (called by hooks)
│   │   ├── boardService.ts
│   │   ├── columnService.ts
│   │   ├── cardService.ts
│   │   └── activityService.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Supabase client
│   │   │   ├── server.ts         # Server Supabase client (Route Handlers / RSC)
│   │   │   └── middleware.ts     # Session refresh middleware
│   │   └── validators/
│   │       ├── boardSchemas.ts   # Zod schemas for boards
│   │       ├── columnSchemas.ts
│   │       └── cardSchemas.ts
│   │
│   └── types/
│       └── index.ts              # Shared TS interfaces (Board, Column, Card, Comment, …)
│
├── tests/
│   ├── unit/                     # Vitest — pure logic + services
│   ├── components/               # Vitest + React Testing Library
│   └── e2e/                      # Playwright
│
├── supabase/
│   └── migrations/               # SQL migration files (managed via Supabase CLI)
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

**Structure Decision**: Single Next.js project (Option 1 variant). No separate backend
service — all API logic lives in `app/api/v1/` Route Handlers. Supabase handles the
database, auth, and real-time pub/sub, so no Redis or standalone auth server is needed.

---

## Complexity Tracking

No constitution violations to justify.
