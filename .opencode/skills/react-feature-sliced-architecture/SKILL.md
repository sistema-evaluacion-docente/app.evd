---
name: react-feature-sliced-architecture
description: Use this skill whenever working on this React project — it uses Tailwind CSS, Zustand, Firebase, dayjs, lucide-react, wouter, TanStack React Query, and use-debounce, organized with a feature-sliced folder structure (components, config, context, features, lib, pages). Apply this skill when creating or editing a feature, component, custom hook, API/service function, page, Zustand store, React Query query/mutation, Firebase call, or route. Also apply it when the user asks to scaffold something new, refactor existing code, fix lint/format issues, or asks about project structure or conventions. Trigger this even if the user doesn't say "feature sliced" or name the stack explicitly — if the code lives in this project, these rules apply.
---

# React Feature-Sliced Architecture (this project's stack & conventions)

This skill defines how code must be organized and written in this project. Always follow it when creating or modifying files. If a request would violate these rules (e.g. putting business logic in `pages/`, calling Firebase directly from a component), fix it and briefly explain why, rather than silently doing what was literally asked.

## Stack

- **UI**: React (function components + hooks only, no classes)
- **Styling**: Tailwind CSS (utility-first, no ad-hoc CSS files unless truly unavoidable)
- **Global/client state**: Zustand
- **Server state**: TanStack React Query (`@tanstack/react-query`)
- **Backend**: Firebase (Auth / Firestore / etc.)
- **Routing**: wouter
- **Dates**: dayjs
- **Icons**: lucide-react
- **Debounce**: use-debounce (`useDebounce` / `useDebouncedCallback`)
- **Linting/formatting**: ESLint + Prettier — code must always be written so it passes both with no warnings.

## Top-level folder structure

```
src/
├── components/   # Shared, reusable, presentational UI components (used by 2+ features/pages)
├── config/       # App-wide configuration: firebase.ts, queryClient.ts, routes.ts, env.ts
├── context/      # React Context providers (cross-cutting concerns, NOT server or domain state)
├── features/     # Business/domain logic, sliced by feature (see below)
├── lib/          # Framework-agnostic utilities/helpers (date formatting, cn(), debounce helpers, etc.)
```

### Import direction (never violate this)

`pages` → `features` → `components` / `lib` / `config`

- `pages/*` may import from `features/*`, `components/*`, `context/*`, `lib/*`, `config/*`.
- `features/*` may import from `components/*`, `lib/*`, `config/*`, `context/*`, and from **its own** subfolders.
- `features/*` must **never** import from `pages/*`.
- One feature must **never** deep-import another feature's internals (e.g. `features/users/api` or `features/users/components/UserCard`). If feature A needs something from feature B, import it from feature B's `index.ts` public API only: `import { useGetUsers } from "@/features/users"`.
- `components/*` and `lib/*` must never import from `features/*` or `pages/*` — they must stay generic and reusable.

## Feature structure

Every folder under `features/` follows this exact shape:

```
features/users/
├── api/            # Single barrel: fetch/service functions + the React Query hooks that use them
│   └── index.ts
├── store/          # Optional: Zustand stores for this feature's own client state
│   ├── useUsersFilterStore.ts
│   └── index.ts    # Barrel — exports every store in this folder
├── hooks/          # Optional: feature-specific hooks that are NOT about fetching (e.g. local filter/search state)
│   ├── useUserSearch.ts
│   └── index.ts    # Barrel — exports every hook in this folder
├── components/     # Feature-scoped presentational/container components
│   ├── UserList.tsx
│   ├── UserCard.tsx
│   └── index.ts    # Barrel — exports every component in this folder
├── types/          # TypeScript types/interfaces for this feature
│   ├── user.types.ts
│   └── index.ts    # Barrel — exports every type in this folder
├── pages/          # This feature's own page-level components (full-page composition)
│   ├── UsersPage.tsx
│   └── index.ts    # Barrel — exports every page in this folder
└── index.ts        # Public API — re-exports everything from api/, store/, hooks/, components/, types/, and pages/
```

Only create the subfolders a feature actually needs — a tiny feature might skip `hooks/`, `store/`, or `pages/`. Every feature always has `api/index.ts` and the top-level `index.ts`; whichever of `store/`, `hooks/`, `components/`, `types/`, `pages/` exist must have their own `index.ts` barrel.

### `api/` — fetch functions + React Query hooks in one barrel

- `api/index.ts` is the **only** file in this folder and the only place allowed to call Firebase (or any external API) directly.
- It contains two layers, stacked in the same file:
  1. **Raw request functions** — plain `async` functions, **not exported**, named by verb + noun: `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`. Pure request/response logic, no React here.
  2. **React Query hooks** that wrap those functions — these ARE exported, named `useGet<Thing>` / `useGet<Thing>ById` / `useList<Things>` for queries and `useCreate<Thing>` / `useUpdate<Thing>` / `useDelete<Thing>` for mutations.
- Keep a **query-key factory** in the same file so keys stay consistent and invalidation is easy. Mutations invalidate the relevant query keys in `onSuccess`.
- Never export the raw request function itself — only the hook that wraps it. Nothing outside `api/index.ts` should call `getUsers` directly; it must always go through `useGetUsers`.

```ts
// features/users/api/index.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { User, NewUser } from '../types/user.types'

// --- raw requests (private to this file) ---
async function getUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, 'users'))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
}

async function createUser(payload: NewUser): Promise<string> {
  const ref = await addDoc(collection(db, 'users'), payload)
  return ref.id
}

// --- query keys ---
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
}

// --- hooks (public) ---
export function useGetUsers() {
  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: getUsers,
    staleTime: 60_000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}
```

### `store/` — Zustand stores for this feature (optional)

- Contains this feature's Zustand stores — shared **client** state specific to this feature (UI state, selections, filters kept across components). This is not for server data — that always goes through `api/`.
- One store per file, named `use<Domain>Store.ts`, exporting a single `use<Domain>Store` hook.
- Mandatory `store/index.ts` barrel that re-exports every store hook in the folder.
- If the feature has no client state worth centralizing, skip this folder entirely.

```ts
// features/cart/store/useCartStore.ts
import { create } from 'zustand'
import type { CartItem } from '../types/cart.types'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))
```

```ts
// features/cart/store/index.ts
export { useCartStore } from './useCartStore'
```

### `hooks/` — non-fetch feature hooks (optional)

- React Query hooks now live in `api/index.ts` (see above), **not here**. This folder is only for feature-specific hooks that have nothing to do with server data — local UI state, derived values, a debounced search input, etc.
- One hook per file, filename matches the hook name.
- If a feature has no such hooks, skip this folder entirely. If it exists, it must have its own `index.ts` barrel too:

```ts
// features/users/hooks/useUserSearch.ts
import { useState } from 'react'
import { useDebounce } from 'use-debounce'

export function useUserSearch() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  return { search, setSearch, debouncedSearch }
}
```

```ts
// features/users/hooks/index.ts
export { useUserSearch } from './useUserSearch'
```

### `components/` (inside a feature)

- Feature-scoped UI only. If a component is generic enough to be reused by other features (e.g. a generic `DataTable`, `EmptyState`, `ConfirmDialog`), it belongs in the top-level `components/`, not here.
- Keep components small and focused on rendering; fetch data via the hooks exported from `api/index.ts`, never call the raw request functions or Firebase directly from a component.
- Style with Tailwind utility classes; use a `cn()` helper (from `lib/cn.ts`) for conditional classes instead of manual string concatenation.
- One component per file, and a mandatory `components/index.ts` barrel that re-exports every component in the folder:

```ts
// features/users/components/index.ts
export { UserList } from './UserList'
export { UserCard } from './UserCard'
```

### `types/`

- One file per domain concept when it grows, otherwise `<feature>.types.ts` is fine for small features.
- Export `interface`/`type`, never `class`, for data shapes.
- Types used across features belong in a shared location (e.g. `lib/types.ts` or `config/`), not duplicated per feature.
- Mandatory `types/index.ts` barrel that re-exports every type in the folder:

```ts
// features/users/types/index.ts
export type { User, NewUser } from './user.types'
```

### `pages/` (inside a feature)

- Contains this feature's own page-level components — the full-page UI for a route, composed from this feature's `components/`, the hooks exported from `api/`, `hooks/`, and `store/`. Same "thin" rule as top-level pages: layout + wiring only, no business logic (that stays in `api/`, `hooks/`, `store/`).
- One page component per file, PascalCase, suffixed `Page` (e.g. `UsersPage.tsx`, `UserDetailPage.tsx`).
- Mandatory `pages/index.ts` barrel that re-exports every page in the folder.
- If the feature has no full-page view of its own (e.g. it's only consumed as a widget inside other pages), skip this folder entirely.

```tsx
// features/users/pages/UsersPage.tsx
import { UserList } from '../components'
import { useGetUsers } from '../api'

/**
 * Full page listing all users.
 */
export function UsersPage() {
  const { data: users, isLoading } = useGetUsers()
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Users</h1>
      <UserList users={users} isLoading={isLoading} />
    </div>
  )
}
```

```ts
// features/users/pages/index.ts
export { UsersPage } from './UsersPage'
```

- The top-level `src/pages/` file that wouter actually mounts stays a thin wrapper around this — see the top-level `pages/` section below.

### `index.ts` — public API (barrel)

- Re-exports **everything** the feature exposes, by re-exporting each subfolder's own barrel: hooks and query keys from `api/index.ts` (the raw request functions stay private automatically, since they were never exported from that file), stores from `store/index.ts`, hooks from `hooks/index.ts`, components from `components/index.ts`, types from `types/index.ts`, and pages from `pages/index.ts` — whichever of these subfolders exist.
- Every subfolder barrel (`api/index.ts`, `store/index.ts`, `hooks/index.ts`, `components/index.ts`, `types/index.ts`, `pages/index.ts`) is the single source of truth for what that subfolder exposes — the feature's top-level `index.ts` never re-exports individual files directly, only the subfolder barrels:

```ts
// features/users/index.ts
export * from './api'
export * from './store' // only if the feature has a store/ folder
export * from './hooks' // only if the feature has a hooks/ folder
export * from './components'
export * from './types'
export * from './pages' // only if the feature has a pages/ folder
```

- `components/index.ts` and `types/index.ts` are mandatory whenever those folders exist (see their sections above). `hooks/index.ts`, `store/index.ts`, and `pages/index.ts` follow the same pattern whenever those folders exist.

## Other top-level folders

### `components/` (global)

- Shared, dumb, reusable UI primitives and composites (buttons, inputs, modals, tables, layout shells).
- No knowledge of any specific feature/domain.
- Icons: import individually from `lucide-react`, e.g. `import { Trash2, Plus } from "lucide-react"` — never bulk-import the whole library.

### `config/`

- `firebase.ts` — Firebase app/init + exported `db`, `auth`, etc. This is the **only** place Firebase is initialized.
- `queryClient.ts` — the single `QueryClient` instance and its default options (staleTime, retry, etc.).
- `routes.ts` — route path constants used with wouter, so paths aren't hardcoded as strings across the app.
- Env variable access (`import.meta.env...`) should be wrapped and validated here, not read ad hoc elsewhere.

### `context/`

- Use React Context only for things that are genuinely cross-cutting UI/app concerns with no server-state component: theme, auth-session-derived UI state, feature flags, layout state.
- **Do not** use Context for server data (that's React Query's job) or for state better modeled as a Zustand store (shared client state accessed from many unrelated places, e.g. a cart, a global filter panel, UI-wide modals/toasts).
- Rule of thumb: Context = dependency injection for a subtree; Zustand = global client state accessed from anywhere; React Query = anything that comes from the server.

### `lib/`

- Pure, framework-agnostic helpers with no feature knowledge: `cn.ts` (clsx/tailwind-merge wrapper), `date.ts` (dayjs setup — plugins, locale, `formatDate()` helpers — configure dayjs **once** here, never call `dayjs.extend` elsewhere), generic formatters/validators.
- No React Query, no Firebase, no Zustand stores here.

### `pages/`

- One file (or folder) per route, mounted via wouter's `<Route>`.
- Pages are thin: they compose feature components/hooks and lay out the page. No direct API/Firebase calls, no inline business logic — if a page needs logic, that logic belongs in a feature hook, store, or the feature's own `pages/` component.
- If a route maps 1:1 onto a single feature's page (the common case), keep this file a thin re-export of that feature's `pages/` component instead of re-composing it here:

```tsx
// pages/UsersPage.tsx
export { UsersPage as default } from '@/features/users'
```

- If a route needs to compose pieces from **multiple** features into one screen, do that composition here directly — still layout + wiring only, no business logic:

```tsx
// pages/DashboardPage.tsx
import { RevenueChart } from '@/features/analytics'
import { RecentUsersList } from '@/features/users'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      <RevenueChart />
      <RecentUsersList />
    </div>
  )
}
```

## Zustand conventions

- One store per domain/concern. App-wide/shared stores go in a dedicated top-level `store/` folder (with its own `index.ts` barrel) if the app grows enough to need one, or `config/` for simple config-like state. Feature-specific stores always live in `features/<name>/store/` (see that feature section above) — never in `hooks/` or a loose `store.ts` file.
- Name store hooks `use<Domain>Store`.
- Use selectors to avoid unnecessary re-renders: `const count = useCartStore((s) => s.items.length)`, never destructure the whole store.
- Keep actions inside the store definition; components call actions, they don't mutate state directly.
- Don't use Zustand for server data — that's React Query's responsibility.

## React best practices to enforce

- Function components only, hooks only (no class components, no legacy lifecycle patterns).
- Respect the Rules of Hooks — no conditional hooks, correct and complete dependency arrays (`react-hooks/exhaustive-deps` must pass).
- Keep components small and single-purpose; extract logic into custom hooks once a component mixes more than one concern (fetching + form state + derived UI state, etc.).
- Avoid prop drilling more than 2 levels — use composition, Context, or Zustand as appropriate (see rule of thumb above).
- Memoize (`useMemo`/`useCallback`/`React.memo`) only when there's a real, measurable reason (expensive computation, referential stability for a memoized child, dependency of another hook) — don't memoize by default.
- Derive state instead of duplicating it in `useState` when it can be computed from props/other state.
- Keep side effects in `useEffect` minimal and justified; data fetching goes through React Query, not raw `useEffect` + `fetch`/Firebase calls.
- Prefer early returns over deeply nested JSX conditionals.

## Tailwind conventions

- Utility-first; compose with the shared `cn()` helper for conditional/merged classes.
- No inline arbitrary magic values unless there's truly no token for it (`text-[13px]` etc. should be rare).
- Co-locate small variant logic in the component; extract to a shared `components/` primitive once a pattern repeats across 3+ places.

## Routing (wouter)

- Route path strings live in `config/routes.ts` as named constants, not hardcoded strings scattered through `pages/`/`components/`.
- One page component per route; nested/param routes still map to a single file in `pages/` unless the page itself is complex enough to warrant its own folder.

## ESLint & Prettier

All code must be written so it needs no manual fixing to pass lint/format:

- No unused vars/imports.
- Consistent import order: external packages → `@/config` → `@/lib` → `@/context` → `@/features` → `@/components` → `@/pages` → relative imports last.
- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` must pass — never disable these rules to silence a warning; fix the actual dependency issue instead.
- Prefer named exports everywhere except page components (default export, since wouter/route registration expects a default in this project) and the top-level `App`.
- Use TypeScript types/interfaces for all props and function signatures — no implicit `any`.
- Prettier formatting (quotes, semicolons, trailing commas, width) is authoritative — don't hand-format against it.

## Documentation conventions (avoid duplicating code)

The barrels (`api/index.ts`, `store/index.ts`, `hooks/index.ts`, `components/index.ts`, `types/index.ts`, `pages/index.ts` per feature, plus the top-level `components/` and `lib/`) are the map of everything that already exists in the app. Documentation exists to make that map readable so nobody re-implements something that's already there.

### Search before creating

Before writing a new component, hook, store, or page, check in this order:

1. Top-level `components/` — is this generic enough that it should live (or already lives) there?
2. The relevant feature's `components/index.ts`, `types/index.ts`, `api/index.ts`, `hooks/index.ts`, `store/index.ts`, `pages/index.ts` — does this feature already expose something close?
3. `lib/` — is this a formatting/validation helper that already exists?

If something close already exists, extend it (add a prop, a variant, an optional param) instead of duplicating it. Only create a new file when nothing already covers the need.

### JSDoc/TSDoc on every exported symbol

Every component, hook, and type exported from a barrel gets a short JSDoc block directly above its definition — colocated with the code, not a separate doc file that can fall out of sync:

- **Components**: one-line description of what it renders/does, plus an `@example` showing typical usage.
- **Hooks**: description of what it fetches/does; add `@returns` if not obvious from the name, plus an `@example` with a realistic call.
- **Types**: a one-line description on the type itself, and on any non-obvious field.

```tsx
/**
 * Displays a paginated, sortable list of users.
 *
 * @example
 * <UserList users={users} isLoading={isLoading} />
 */
export function UserList({ users, isLoading }: UserListProps) {
  // ...
}
```

```ts
/**
 * Fetches all users via React Query. Cached for 60s.
 *
 * @example
 * const { data: users, isLoading } = useGetUsers();
 */
export function useGetUsers() {
  // ...
}
```

```ts
/** A user record as stored in the `users` Firestore collection. */
export interface User {
  /** Firestore document id. */
  id: string
  name: string
  email: string
}
```

### Optional: generate a browsable catalog

Once the app has enough shared pieces, two lightweight tools turn these JSDoc comments into a browsable catalog with no extra manual writing:

- **TypeDoc** — generates an HTML/markdown reference from the JSDoc in `lib/`, top-level `components/`, and every feature's `api/index.ts` / `hooks/index.ts` / `types/index.ts`.
- **Storybook** — for the top-level `components/` (and any feature component worth visualizing), gives a live, clickable catalog with props controls. Only worth adding once `components/` has grown past a handful of primitives.

Neither tool replaces the JSDoc — they're just a nicer way to browse it.

## Checklist when scaffolding a new feature

0. Search existing barrels first (top-level `components/`, the target feature's `api/index.ts` / `store/index.ts` / `components/index.ts` / `types/index.ts` / `hooks/index.ts` / `pages/index.ts`, and `lib/`) — extend something existing instead of duplicating it if a close match is found.
1. Create `features/<name>/` with only the subfolders it needs (`api` is mandatory; add `store`, `hooks`, `components`, `types`, `pages` only if needed).
2. Write `api/index.ts`: private raw request functions (Firebase/Firestore calls live only here), a query-key factory, and the exported React Query hooks that wrap those requests, with proper invalidation on mutations. Add a short JSDoc block above each exported hook.
3. If the feature needs its own client state (not server data), add a Zustand store in `store/` with its own `index.ts` barrel.
4. If the feature needs non-fetch hooks (debounce, local filters, etc.), add them in `hooks/` with its own `index.ts` barrel and JSDoc on each hook.
5. Write feature components in `components/`, styled with Tailwind, using shared primitives from top-level `components/` where possible, consuming data only through the hooks exported from `api/index.ts` (and state from `store/` if present). Add `components/index.ts` re-exporting every component, and a JSDoc block with an `@example` above each.
6. Add types in `types/`. Add `types/index.ts` re-exporting every type, with a one-line JSDoc description on each type and non-obvious field.
7. If the feature has a full-page view of its own, write it in `pages/`, composed only from this feature's `components/`, `api/`, `hooks/`, and `store/`. Add `pages/index.ts` re-exporting every page.
8. Export the full public surface via `index.ts` (`export * from "./api"`, `"./store"`, `"./hooks"`, `"./components"`, `"./types"`, `"./pages"` — whichever exist) — nothing outside the feature imports from anywhere but this file, and the top-level `index.ts` only re-exports subfolder barrels, never individual files directly.
9. Wire it into a page in the top-level `pages/` (thin composition, or a thin re-export of the feature's own page — see the `pages/` section) and register the route in `config/routes.ts`.
10. Double-check imports respect the layering rules above, and that lint/format are clean.
