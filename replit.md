# Project Overview

A Brazilian salon/beauty business management app (SaaS) built with React + Vite + TypeScript. Features include scheduling (Agenda), client management, services, professionals, goals, reports, financials, and subscriptions. Uses Supabase as the backend (auth + database).

## Backend migration (in progress)

The frontend is being moved off direct Supabase calls onto an internal Express API under `server/`. Strategy and progress are tracked in `MIGRATION.md`. The dev script `npm run dev` now runs Vite (port 5000) and the API (port 3001) in parallel via `concurrently`; Vite proxies `/api/*` to the API. Auth still uses Supabase Auth — the API trusts the Supabase JWT and creates a per-request Supabase client so RLS continues to enforce multi-tenancy. Migrated so far: `Clientes.tsx`, `Profissionais.tsx`, `Servicos.tsx` (services + service-categories), `Agenda.tsx` (CRUD + hydrated joins server-side, with `end_time`/`duration`/`price` derived from the chosen service on the server), `Onboarding.tsx` (single transactional `POST /api/onboarding` that creates tenant + profile link + owner role + 15-day-trial subscription + default category + initial services + initial professionals, with compensating rollback on failure since PostgREST has no multi-statement transaction), and the `AuthContext` profile/tenant/role bootstrap (now via `GET /api/me`). Supabase Auth itself is still in place for login/session/JWT.

### Phase D — Postgres + Drizzle migration (in progress)

User decided to move off Supabase entirely, hosting Postgres on their own AWS EC2 with a self-built auth system. The full plan lives in `.local/session_plan.md` (8 phases S1-S8). Current status:
- **S1 (done)** — Postgres 18 installed on EC2 (Ubuntu), database `barberflow` and role `barberflow` created, `DATABASE_URL` added to the EC2 `.env`.
- **S2 (done)** — Drizzle ORM installed (`drizzle-orm`, `drizzle-kit`, `pg`, `dotenv`). Schema in `server/db/schema.ts` mirrors the 9 tables actively used by the API today (tenants, profiles, user_roles, tenant_subscriptions, service_categories, services, professionals, clients, appointments) — same column names as Supabase to keep route-by-route migration in S3 mechanical. Connection pool in `server/db/index.ts`. Migration SQL generated at `server/db/migrations/0000_init_schema.sql`. Drizzle Kit config at `drizzle.config.ts` loads `.env` via `dotenv/config` so it works on Node 18 too. New scripts: `db:generate`, `db:migrate`, `db:studio`, `db:check`. **Migration not yet applied to EC2** — user runs `npm run db:migrate` on the EC2 to apply.
- **S3-S8** — pending: rewrite each API route to use Drizzle, build own auth, frontend cutover, remove Supabase, set up backups.

## Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (hosted) — authentication, database, real-time
- **Routing**: React Router v6
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

## Key Files & Structure

```
src/
  App.tsx              — Root component with routes and providers
  main.tsx             — App entry point
  index.css            — Global styles + Tailwind + CSS variables
  pages/               — Page-level components (Dashboard, Agenda, etc.)
  components/          — Shared UI components (AppLayout, AuthGuards, etc.)
  contexts/            — React contexts (AuthContext)
  hooks/               — Custom hooks
  integrations/        — Supabase client setup
  lib/                 — Utility functions
  data/                — Static/seed data
  types/               — TypeScript type definitions
```

## Running the App

- **Dev server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`

## Environment Variables

Stored as Replit environment variables (shared):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key

## Notes

- Migrated from Lovable to Replit. Removed `lovable-tagger` dev dependency from vite config.
- CSS `@import` for Google Fonts moved before Tailwind directives to fix build warning.
- Dev server configured for `0.0.0.0` host on port 5000 with `allowedHosts: true` for Replit proxy compatibility.

## PWA (Mobile-First)

The app is configured as a Progressive Web App focused on mobile usage.

- Plugin: `vite-plugin-pwa` with `registerType: "autoUpdate"`.
- Manifest defined inline in `vite.config.ts` (name, theme/background `#0f172a`, `display: standalone`, `orientation: portrait`, lang `pt-BR`).
- Icons: `public/icon.svg` and `public/apple-touch-icon.svg`.
- `index.html` includes PWA meta tags (theme-color, apple-mobile-web-app-*, manifest link, viewport with `viewport-fit=cover`).
- Service worker registered via `src/components/PWAUpdatePrompt.tsx`, which shows a Sonner toast when a new version is ready.
- Dev mode: PWA is enabled in dev (`devOptions.enabled: true`) so the SW can be tested while developing.
