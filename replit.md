# Project Overview

A Brazilian salon/beauty business management app (SaaS) built with React + Vite + TypeScript. Features include scheduling (Agenda), client management, services, professionals, goals, reports, financials, and subscriptions. Uses Supabase as the backend (auth + database).

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
