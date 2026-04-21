# Project Overview

A Brazilian salon/beauty business management app (SaaS) built with React + Vite + TypeScript. Features include scheduling (Agenda), client management, services, professionals, goals, reports, financials, and subscriptions. Uses Supabase as the backend (auth + database).

## Backend migration (in progress)

The frontend is being moved off direct Supabase calls onto an internal Express API under `server/`. Strategy and progress are tracked in `MIGRATION.md`. The dev script `npm run dev` now runs Vite (port 5000) and the API (port 3001) in parallel via `concurrently`; Vite proxies `/api/*` to the API. Auth still uses Supabase Auth — the API trusts the Supabase JWT and creates a per-request Supabase client so RLS continues to enforce multi-tenancy. Migrated pages so far: `Clientes.tsx`.

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
