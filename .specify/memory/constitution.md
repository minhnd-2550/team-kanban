<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Modified sections: Technology Stack (React+Node.js split → Next.js fullstack)
Added sections: N/A
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md       ✅ no changes required (generic)
  - .specify/templates/spec-template.md       ✅ no changes required (generic)
  - .specify/templates/tasks-template.md      ✅ no changes required (generic)
  - .specify/templates/constitution-template.md ✅ source template, unchanged
Deferred TODOs: none
-->

# TeamKanban Constitution

## Core Principles

### I. User-Centric Simplicity

The application MUST remain simple and immediately usable by small teams (2–10 members)
without any onboarding overhead.

- Every screen MUST expose only the actions relevant to the current context; no feature bloat.
- The three-column board (To Do / In Progress / Done) is the primary and canonical view; deviations
  require explicit justification and team approval.
- New features MUST NOT increase the cognitive load of existing workflows.

**Rationale**: Small teams choose lightweight tools. Complexity drives abandonment.

### II. Real-Time Collaboration

Board state MUST be reactive and consistent across all connected team members.

- Card moves, additions, and deletions MUST propagate to all active sessions within 1 second
  under normal network conditions (WebSocket or equivalent push mechanism).
- Optimistic UI updates are REQUIRED for drag-and-drop operations; conflicts MUST be resolved
  server-side with last-write-wins, and the resolved state re-synced to all clients.
- Offline edits are out of scope for v1; the UI MUST surface a clear "disconnected" indicator
  when connectivity is lost.

**Rationale**: A shared board with stale data is worse than no board.

### III. Test-First (NON-NEGOTIABLE)

TDD is MANDATORY across the entire codebase.

- Tests MUST be written and reviewed before implementation begins (Red → Green → Refactor).
- Unit coverage threshold: **≥ 80 %** on all non-UI utility modules, API route handlers,
  and state-management logic.
- Every user-facing feature MUST have at least one end-to-end (E2E) test covering the happy path.
- Pull requests that reduce coverage below threshold MUST NOT be merged.

**Rationale**: Continuous change in collaborative tooling demands a safety net. No exceptions.

### IV. Component-Based Frontend Architecture

The frontend MUST be organised as a library of small, independently testable UI components.

- Each component MUST have a single, clearly documented responsibility (e.g., `KanbanCard`,
  `ColumnHeader`, `AddCardForm`).
- Shared components MUST live in `src/components/`; page-level compositions in `app/`
  following Next.js App Router conventions (layouts, pages, loading, error segments).
- Props / interfaces MUST be explicitly typed (TypeScript); `any` is forbidden.
- Components MUST NOT contain business logic; data-fetching and state MUST be abstracted into
  hooks or service layers.

**Rationale**: Reusable components accelerate iteration and make testing straightforward.

### V. Stateless & Versioned API Design

The backend API MUST be stateless and follow RESTful conventions, versioned from day one.

- All Route Handlers MUST be placed under `app/api/v{n}/` (e.g., `app/api/v1/cards/route.ts`).
- Authentication MUST be handled via NextAuth.js (Auth.js); session strategy MUST be JWT;
  sessions MUST NOT be stored server-side.
- Breaking changes to an existing API version are FORBIDDEN; introduce a new version instead.
- All endpoints MUST return consistent JSON envelopes: `{ data, error, meta }`.

**Rationale**: Stateless design enables horizontal scaling; versioning protects clients from
undisclosed breaking changes.

## Technology Stack

Approved and mandated technologies for v1. Deviations require a constitution amendment.

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) with TypeScript |
| Styling | Tailwind CSS |
| Client state / real-time | Zustand + WebSocket (socket.io or native) |
| API layer | Next.js Route Handlers (`app/api/v1/`) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | Auth.js (NextAuth.js v5) — JWT strategy |
| Testing – unit | Vitest + React Testing Library |
| Testing – E2E | Playwright |
| CI/CD | GitHub Actions |
| Deployment | Vercel (production); Docker Compose (local dev) |

- There is NO separate backend service; all server-side logic MUST live in Next.js
  Route Handlers, Server Actions, or Server Components.
- Third-party UI component libraries are PERMITTED only if they are accessible (WCAG 2.1 AA),
  tree-shakeable, and actively maintained.
- `any` type in TypeScript is FORBIDDEN across the entire codebase.

## Development Workflow

All contributors MUST follow this workflow without exception.

1. **Branch naming**: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
2. **Spec-first**: Every non-trivial feature MUST have a spec file under `.specify/` approved
   before the first line of implementation code is committed.
3. **TDD cycle**: Write failing tests → get approval → implement → all tests green → open PR.
4. **Pull request requirements**:
   - At least **1 peer review** approval before merge.
   - CI pipeline (lint + unit tests + E2E smoke) MUST be fully green.
   - Coverage MUST NOT drop below the thresholds defined in Principle III.
   - PR description MUST reference the related spec or issue.
5. **Definition of Done (DoD)**:
   - Feature works in all three columns (To Do / In Progress / Done).
   - Real-time sync verified between two browser sessions.
   - Unit tests ≥ 80 % coverage for the changed module.
   - E2E happy-path test passing.
   - No TypeScript errors; linter reports zero warnings.

## Governance

- This constitution supersedes all other practice documents, verbal agreements, and ad-hoc
  decisions. When conflict arises, the constitution wins.
- **Amendment procedure**: Raise a PR against `constitution.md`. Requires discussion in the
  PR comments and approval from **all active maintainers**. Amendment MUST increment the version
  (see versioning policy below) and update `LAST_AMENDED_DATE`.
- **Versioning policy**:
  - MAJOR — Backward-incompatible removal or redefinition of a principle.
  - MINOR — New principle, section added, or materially expanded guidance.
  - PATCH — Clarifications, wording fixes, non-semantic refinements.
- **Compliance review**: Each sprint retrospective MUST include a quick check that recent work
  adhered to all five principles. Non-compliance MUST be documented as a tech-debt item.
- For day-to-day runtime guidance refer to `.specify/` specs and plan files.

**Version**: 1.1.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04
