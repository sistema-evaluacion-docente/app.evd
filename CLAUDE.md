# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Frontend SPA for a teacher-evaluation system (UFPS university). Directors upload PDF evaluation
reports, the backend (separate FastAPI repo, `api.evd`) extracts and analyzes them with AI, and this
app renders results, rankings, and improvement plans for directors, teachers, and admins. Backend API
contract is documented in `openapi.json` at the repo root.

## Commands

```bash
pnpm install          # pnpm >=9, Node >=20
pnpm dev               # Vite dev server, http://localhost:5173
pnpm build             # tsc -b && vite build — run this to typecheck, no separate typecheck script
pnpm lint              # eslint .
pnpm format            # prettier --write .
pnpm format:check      # prettier --check .
pnpm preview           # preview production build
pnpm test              # vitest (watch mode)
pnpm test:run          # vitest run (single pass, use this in CI/scripts)
pnpm test:coverage     # vitest run --coverage
```

Run a single test file: `pnpm vitest run path/to/file.test.tsx`.

Vitest is configured (`vite.config.ts`, jsdom env, `src/test/setup.ts`) but no `*.test.*` files exist
yet in `src/` — this is not a codebase with an established testing pattern to follow by example.

## TypeScript / lint quirks (enforced, will fail build)

- `verbatimModuleSyntax: true` — always use `import type { X }` for type-only imports.
- `erasableSyntaxOnly: true` — no enums, no namespaces, no parameter properties.
- `noUnusedLocals` / `noUnusedParameters` — strict; remove unused code rather than prefixing.
- `src/components/ui` (shadcn primitives) is excluded from eslint — don't hand-edit lint issues there.

## Architecture

Layered, feature-based structure under `src/`:

```
app/          entry (main.tsx), route table (App.tsx), global styles
features/     one dir per bounded feature: api/ components/ pages/ types/ (+ store/, hooks/, config/ as needed)
entities/     shared domain models (teacher, evaluation) with no feature-specific logic
components/   common/ (app chrome: layout, sidebar, data table, form drawer...), ui/ (shadcn primitives), skeletons/
config/       axios instance, firebase init, env (index.ts), role→route access map (security.ts)
hooks/        cross-feature hooks (useAuth, useFileUpload, useTableFilters, ...)
lib/          framework-free utilities (formatDate, formatBytes, apiError, questions, utils)
@types/       shared ambient/response types (Response.ts)
test/         vitest setup + render helper
```

Each feature exports its public surface through `index.ts` (e.g. `export * from './api'`,
`export * from './components'`, named page exports). Import from the feature root
(`@/features/teachers`), not from internal files. `@/` maps to `src/` (see `tsconfig.app.json` and
`vite.config.ts`).

Within a feature, `api/` holds raw request functions (kept **unexported**) plus the TanStack Query
hooks that wrap them for consumption — components call the hooks, not the raw functions.

Routes live in `src/app/App.tsx` as a wouter `<Switch>`; route paths are Spanish
(`/docentes`, `/evaluaciones`, `/admin/facultades`, ...). Route→role access is declared separately in
`src/config/security.ts` (`getMenus(role)`); `AppLayout` uses this to gate sidebar links and page access
— when adding a route, update both files.

### Auth & API flow

- Firebase Auth (email/password + Google). Auth state lives in a Zustand store
  (`src/features/auth/store/useAuthStore.ts`) — `selectedRole` is persisted to `localStorage` there, not
  in React context.
- `src/config/axios.ts`: request interceptor injects the Firebase Bearer token; response interceptor
  unwraps `response.data` (callers get the payload directly, not an Axios response) and centrally
  toasts + rethrows an `ApiError` (see `src/lib/apiError.ts`) on failure — don't add per-call try/catch
  for the generic error-toast case.

### Styling

Tailwind CSS v4, no `tailwind.config.js` — theme lives in `src/app/styles/index.css` via `@import
"tailwindcss"` and CSS custom properties. Dark mode via `next-themes`, `.dark` class strategy.
shadcn/ui components (Base UI-driven) live in `src/components/ui`; treat them as generated/vendored —
extend via composition in `components/common` rather than editing primitives.

## Environment

Copy `.env.example` to `.env`: `VITE_API_URL` + `VITE_FIREBASE_*` keys. `.env` is gitignored. For
Docker, the same vars are passed as build args (see `docker-compose.yml`, `Dockerfile`).
