# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Mozhi — Tamil Cultural Platform (`artifacts/mozhi`)
- **Kind**: Web app (Vite + React + TypeScript)
- **Preview path**: `/`
- **Port**: 25869 (reads `PORT` env var)
- **Routing**: `wouter` (all Next.js routing replaced)
- **UI components**: `@base-ui/react` (from original project — NOT Radix UI)
- **State**: `zustand`
- **Auth/DB**: Supabase + Firebase (credentials not yet configured — placeholder values used)
- **Fonts**: Lora + DM Sans (loaded via Google Fonts in `index.html`)
- **Theme**: Warm terracotta (`--primary: 21 75% 40%`) in `src/index.css`

#### Migration notes (from Next.js/Vercel)
- `next/link` → `wouter` `{ Link }`
- `next/navigation` → `src/lib/navigation.ts` shim
- `next/image` → `src/lib/next-image.tsx` shim
- `next/font/google` → `src/lib/fonts.ts` shim
- `NEXT_PUBLIC_*` env vars → `VITE_*`
- Server components converted to plain client components
- API routes not migrated (frontend-only migration)

### API Server (`artifacts/api-server`)
- **Kind**: Express 5 REST API
- **Database**: PostgreSQL + Drizzle ORM
