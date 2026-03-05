# Quickstart: TeamKanban — Local Development

**Date**: 2026-03-04 | **Plan**: [plan.md](./plan.md)

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 LTS | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Docker Desktop | ≥ 4 | [docker.com](https://www.docker.com/products/docker-desktop) |
| Supabase CLI | ≥ 1.200 | `brew install supabase/tap/supabase` |

---

## 1. Clone & Install

```bash
git clone https://github.com/<org>/teamkanban.git
cd teamkanban
pnpm install
```

---

## 2. Start Local Supabase Stack

```bash
supabase start
```

This spins up (via Docker):
- Postgres on `localhost:54322`
- Supabase Studio on `http://localhost:54323`
- Auth server on `http://localhost:54321`
- Realtime server (WebSocket) on `ws://localhost:54321`

After it starts, the CLI prints your local credentials:

```
API URL: http://localhost:54321
anon key: <local-anon-key>
service_role key: <local-service-key>
```

> `supabase stop` to shut down. `supabase stop --backup` to preserve data.

---

## 3. Apply Database Migrations

```bash
supabase db reset
```

This runs all files in `supabase/migrations/` in order and seeds test data (if a
`supabase/seed.sql` exists). Re-run this whenever you add a new migration.

---

## 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase (use values printed by `supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key>  # server-side only, never expose to browser

# App URL (used by Supabase Auth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> The `.env.local` file is already in `.gitignore`. Never commit secrets.

---

## 5. Run the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Hot-reload, TypeScript type-checking, and Tailwind JIT are all active in dev mode.

---

## 6. Run Tests

```bash
# Unit + component tests (Vitest)
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests (Playwright — requires dev server running)
pnpm test:e2e

# E2E with UI debugger
pnpm test:e2e --ui
```

Coverage threshold (≥ 80%) is enforced in `vitest.config.ts`. CI will fail if it drops below.

---

## 7. Database Migrations

Create a new migration:

```bash
supabase migration new <migration-name>
# → creates supabase/migrations/<timestamp>_<migration-name>.sql
```

Edit the generated SQL file, then apply locally:

```bash
supabase db reset   # full reset + all migrations
# or
supabase db push    # apply only pending migrations (non-destructive)
```

---

## 8. Deployment to Vercel

### First-time setup

1. Create a [Supabase](https://supabase.com) project for production.
2. Run `supabase link --project-ref <your-project-ref>` to link the CLI.
3. Push schema to production: `supabase db push`
4. Enable Realtime on the `columns`, `cards`, `comments`, `activity_events` tables in the
   Supabase Dashboard → Database → Replication.
5. Import the project to [Vercel](https://vercel.com) from GitHub.
6. Add environment variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → service role key (mark as sensitive)

### Continuous deployment

Every push to `main` triggers a Vercel production deploy via the GitHub integration.
Every PR gets an automatic Vercel preview URL.

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint + unit tests + E2E
against the PR preview URL before merge is allowed.

---

## 9. Project Scripts Reference

| Script | Description |
|---|---|
| `pnpm dev` | Next.js dev server with hot-reload |
| `pnpm build` | Production build |
| `pnpm start` | Start production build locally |
| `pnpm lint` | ESLint + TypeScript checks |
| `pnpm test` | Vitest unit + component tests |
| `pnpm test:coverage` | Tests + coverage report |
| `pnpm test:e2e` | Playwright E2E (requires running dev server) |
| `pnpm db:reset` | Alias for `supabase db reset` |
| `pnpm db:push` | Alias for `supabase db push` |

---

## 10. Folder Structure (Quick Reference)

```
app/               Next.js App Router pages + Route Handlers
src/components/    Shared UI components
src/hooks/         TanStack Query + Zustand hooks
src/store/         Zustand stores
src/services/      API client functions
src/lib/           Supabase clients, Zod validators
src/types/         TypeScript interfaces
tests/             Vitest unit + React Testing Library + Playwright
supabase/          Migration SQL files
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `supabase start` fails | Ensure Docker Desktop is running |
| `anon key` mismatch | Re-run `supabase start` and copy fresh keys to `.env.local` |
| Realtime events not arriving locally | Check Supabase Dashboard → Replication; ensure table is enabled |
| Type errors on `supabase` client | Run `supabase gen types typescript --local > src/types/supabase.ts` to regenerate |
| Playwright tests failing | Ensure `pnpm dev` is running; check `playwright.config.ts` `baseURL` |
