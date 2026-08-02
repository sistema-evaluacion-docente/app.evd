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
└── pages/        # Route-level components. Thin: compose features, no business logic.
```

### Import direction (never violate this)

`pages` → `features` → `components` / `lib` / `config`

- `pages/*` may import from `features/*`, `components/*`, `context/*`, `lib/*`, `config/*`.
- `features/*` may import from `components/*`, `lib/*`, `config/*`, `context/*`, and from **its own** subfolders.
- `features/*` must **never** import from `pages/*`.
- One feature must **never** deep-import another feature's internals (e.g. `features/users/hooks/useGetUsers`). If feature A needs something from feature B, import it from feature B's `index.ts` public API only: `import { useGetUsers } from "@/features/users"`.
- `components/*` and `lib/*` must never import from `features/*` or `pages/*` — they must stay generic and reusable.

## Feature structure

Every folder under `features/` follows this exact shape:

```
features/users/
├── api/            # Raw service calls (Firebase, fetch, etc.) — no React here
│   └── users.api.ts
├── hooks/          # Custom hooks: React Query hooks + any other feature-specific hooks
│   ├── useGetUsers.ts
│   ├── useCreateUser.ts
│   └── useUserFilters.ts
├── components/     # Feature-scoped presentational/container components
│   ├── UserList.tsx
│   └── UserCard.tsx
├── types/          # TypeScript types/interfaces for this feature
│   └── user.types.ts
└── index.ts        # Public API — the ONLY thing other layers may import from
```

Only create the subfolders a feature actually needs — a tiny feature might skip `types/` if it only needs primitives, but never skip `index.ts`.

### `api/` — service layer

- Contains the only code allowed to call Firebase (or any external API) directly.
- Pure functions, no hooks, no React Query here — just request/response logic.
- Name files `<feature>.api.ts`. Name functions by verb + noun: `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`.

```ts
// features/users/api/users.api.ts
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { User, NewUser } from "../types/user.types";

export async function getUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
}

export async function createUser(payload: NewUser): Promise<string> {
  const ref = await addDoc(collection(db, "users"), payload);
  return ref.id;
}
```

### `hooks/` — React Query + custom hooks

- One hook per file, filename matches the hook name.
- **Query hooks**: `useGet<Thing>` / `useGet<Thing>ById` / `useList<Things>`.
- **Mutation hooks**: `useCreate<Thing>`, `useUpdate<Thing>`, `useDelete<Thing>`.
- Always define a **query key factory** per feature so keys stay consistent and invalidation is easy.
- Mutations invalidate the relevant query keys in `onSuccess`.

```ts
// features/users/hooks/useGetUsers.ts
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users.api";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
};

export function useGetUsers() {
  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: getUsers,
    staleTime: 60_000,
  });
}
```

```ts
// features/users/hooks/useCreateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/users.api";
import { usersKeys } from "./useGetUsers";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
```

- Non-React-Query hooks (e.g. `useUserFilters`, `useUserSearch`) also live here if they encapsulate feature-specific logic. If they wrap `useDebounce` for a search input, do it here, not in the component:

```ts
// features/users/hooks/useUserSearch.ts
import { useState } from "react";
import { useDebounce } from "use-debounce";

export function useUserSearch() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  return { search, setSearch, debouncedSearch };
}
```

### `components/` (inside a feature)

- Feature-scoped UI only. If a component is generic enough to be reused by other features (e.g. a generic `DataTable`, `EmptyState`, `ConfirmDialog`), it belongs in the top-level `components/`, not here.
- Keep components small and focused on rendering; fetch data via the feature's hooks, don't call `api/` directly from a component.
- Style with Tailwind utility classes; use a `cn()` helper (from `lib/cn.ts`) for conditional classes instead of manual string concatenation.

### `types/`

- One file per domain concept when it grows, otherwise `<feature>.types.ts` is fine for small features.
- Export `interface`/`type`, never `class`, for data shapes.
- Types used across features belong in a shared location (e.g. `lib/types.ts` or `config/`), not duplicated per feature.

### `index.ts` — public API (barrel)

- Re-export only what other layers are allowed to use: hooks, components, and types meant for external consumption.
- Do **not** re-export `api/*` — the service layer is private to the feature.

```ts
// features/users/index.ts
export { useGetUsers } from "./hooks/useGetUsers";
export { useCreateUser } from "./hooks/useCreateUser";
export { UserList } from "./components/UserList";
export type { User } from "./types/user.types";
```

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
- Pages are thin: they compose feature components/hooks and lay out the page. No direct API/Firebase calls, no inline business logic — if a page needs logic, that logic belongs in a feature hook.

```tsx
// pages/UsersPage.tsx
import { UserList, useGetUsers } from "@/features/users";

export default function UsersPage() {
  const { data: users, isLoading } = useGetUsers();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Users</h1>
      <UserList users={users} isLoading={isLoading} />
    </div>
  );
}
```

## Zustand conventions

- One store per domain/concern, colocated where it's used: shared/app-wide stores go in `config/` or a dedicated `store/` folder if it grows; feature-specific stores go inside that feature (e.g. `features/cart/hooks/useCartStore.ts` or `features/cart/store.ts`).
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

## Checklist when scaffolding a new feature

1. Create `features/<name>/` with only the subfolders it needs (`api`, `hooks`, `components`, `types`).
2. Write `api/<name>.api.ts` with pure request functions (Firebase/Firestore calls live only here).
3. Write React Query hooks in `hooks/` with a query-key factory and proper invalidation on mutations.
4. Write feature components in `components/`, styled with Tailwind, using shared primitives from top-level `components/` where possible.
5. Add types in `types/`.
6. Export the public surface via `index.ts` — nothing outside the feature imports from anywhere but this file.
7. Wire it into a page in `pages/` (thin composition only) and register the route in `config/routes.ts`.
8. Double-check imports respect the layering rules above, and that lint/format are clean.