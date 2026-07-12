# AGENTS.md

## Quick start

```bash
pnpm install      # pnpm >=9, Node >=20
pnpm dev          # Vite dev server at http://localhost:5173
pnpm build        # tsc -b && vite build (typecheck + bundle)
pnpm lint         # eslint .
pnpm preview      # vite preview
```

No test framework is configured. Run `pnpm lint` before committing.

## Stack

- React 19, TypeScript 6 (erasableSyntaxOnly), Vite 8, Tailwind CSS 4
- `@/` → `./src/` (Vite + tsconfig path alias)
- Firebase Auth (email/password + Google), Axios (auto-injects Bearer token from Firebase), wouter (routing), TanStack React Query v5, shadcn/ui (Base Vega style, lucide icons, sonner toasts)
- React Compiler enabled via babel-plugin-react-compiler

## TypeScript quirks

- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUnusedLocals` / `noUnusedParameters` — strict, remove unused code
- `erasableSyntaxOnly: true` — no enums, no namespaces, no parameter properties

## Architecture (Feature-Sliced Design)

```
src/
  app/          entry, routes (App.tsx), global styles
  pages/        one dir per route, index.ts
  features/     bounded features (auth, account-upload)
  shared/       base UI components, lib, types, hooks
  components/   shadcn/ui primitives (ui/) and common (common/)
  context/      React context providers (UserContext)
  config/       axios instance, firebase init, env defaults
```

Routes are defined in `src/app/App.tsx` (wouter `<Switch>`).

## Important conventions

- `.env` is gitignored; copy `.env.example` to `.env` and fill in VITE_API_URL + VITE_FIREBASE_* vars
- Axios response interceptor unwraps `response.data` — callers receive the data directly
- CSS is Tailwind v4 (`@import "tailwindcss"`, no `tailwind.config.js`); custom theme in `src/app/styles/index.css`
- Dark mode via `next-themes`, uses `.dark` class strategy
- Error messages are mapped through `src/shared/lib/firebaseErrors.ts`
- `selectedRole` is persisted to `localStorage` via `UserContext`
- All pages export from `index.ts` barrel files
