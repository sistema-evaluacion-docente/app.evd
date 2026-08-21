---
name: react-testing-vitest
description: Use this skill whenever writing, editing, or reviewing unit/integration tests for this React project — components, custom hooks, Zustand stores, React Query hooks, feature `api/` services, or utilities in `lib/`. Applies to Vitest + React Testing Library. Trigger on requests like "write tests for X", "add a test for this hook", "test coverage for this feature", "mock Firebase/React Query in a test", or when creating a new feature/component/hook that should ship with tests. Also apply when asked to fix a failing test, set up the test environment, or review whether existing tests follow project conventions.
---

# React Unit Testing (Vitest + React Testing Library)

This skill defines how tests must be written in this project, matching its stack (React, TypeScript, Tailwind, Zustand, Firebase, React Query, wouter, dayjs, use-debounce) and its feature-sliced folder structure (`components/`, `config/`, `context/`, `features/`, `lib/`, `pages/`).

## Guiding principle

Test **behavior, not implementation**. Interact with components the way a user would (render, query, click/type, assert on what's visible) rather than reaching into internals, state, or props. Mirror the layering rules from the architecture: test each layer (`api`, `hooks`, `components`) at the boundary appropriate to it — don't hit real Firebase from a component test, don't re-test React Query internals, don't test Tailwind classes.

## Toolchain

- **Runner**: Vitest
- **Component testing**: `@testing-library/react`
- **User interaction**: `@testing-library/user-event` (never fire raw DOM events like `fireEvent.click` unless `user-event` genuinely can't express it — prefer `userEvent.setup()` + `await user.click(...)`)
- **Assertions**: `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- **API/Firebase mocking**: `vi.mock()` for module-level mocks of `firebase/*` and feature `api/*` files; use MSW (`msw`) only if the project already has it set up for network-level mocking — otherwise mock at the `api/` module boundary (see below).
- **Timers**: `vi.useFakeTimers()` when testing debounce or dayjs-relative logic.

## File location & naming

- Co-locate tests next to the code they cover, using `.test.ts` / `.test.tsx`:
  ```
  features/users/hooks/useGetUsers.ts
  features/users/hooks/useGetUsers.test.ts

  features/users/components/UserList.tsx
  features/users/components/UserList.test.tsx

  lib/date.ts
  lib/date.test.ts
  ```
- Never create a parallel `__tests__/` tree unless the project already uses one — co-location matches the feature-sliced structure.
- One `describe` block per unit under test, named after it; nested `describe`/`it` for scenarios: `it("returns the loading state while the query is pending")`.

## Setup (only if missing — check first)

Look for `vitest.config.ts` / a `test` block in `vite.config.ts` and a setup file before creating new ones.

```ts
// vitest.config.ts (or the `test` block in vite.config.ts)
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: false,
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

### Test utilities (`src/test/`)

Centralize shared test scaffolding here — don't rebuild providers in every test file.

```tsx
// src/test/render.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

function AllProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
```

Use `renderWithProviders` for anything that touches React Query. Wrap with wouter's `<Router>` too if the component under test uses routing (`useLocation`, `<Link>`, etc.) — add that to `AllProviders` or a separate `renderWithRouter` helper if only some tests need it.

## Testing by layer

### `lib/` — pure utilities

Plain Vitest, no rendering, no mocks needed.

```ts
// lib/date.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './date'

describe('formatDate', () => {
  it('formats an ISO date as DD/MM/YYYY', () => {
    expect(formatDate('2024-03-05T00:00:00Z')).toBe('05/03/2024')
  })
})
```

### `features/*/api/` — service layer

Mock the underlying SDK (Firebase), not your own function. This is the one place that talks to Firebase, so it's also the one place you assert the Firebase calls are shaped correctly.

```ts
// features/users/api/users.api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getUsers } from './users.api'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [{ id: '1', data: () => ({ name: 'Ada' }) }],
  }),
}))

describe('getUsers', () => {
  it('maps Firestore docs into User objects with id', async () => {
    const result = await getUsers()
    expect(result).toEqual([{ id: '1', name: 'Ada' }])
  })
})
```

### `features/*/hooks/` — React Query hooks

Mock the feature's `api/` module (not Firebase directly) so the hook test only asserts React Query wiring: loading/success/error states, correct query key, invalidation on mutation success. Use `renderHook` from `@testing-library/react` with `renderWithProviders`'s wrapper.

```ts
// features/users/hooks/useGetUsers.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useGetUsers } from "./useGetUsers";
import * as usersApi from "../api/users.api";

vi.mock("../api/users.api");

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useGetUsers", () => {
  it("returns the users once the query resolves", async () => {
    vi.mocked(usersApi.getUsers).mockResolvedValue([{ id: "1", name: "Ada" }]);

    const { result } = renderHook(() => useGetUsers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "1", name: "Ada" }]);
  });

  it("exposes an error state when the query fails", async () => {
    vi.mocked(usersApi.getUsers).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useGetUsers(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

For mutation hooks, additionally assert the relevant query key is invalidated (spy on `queryClient.invalidateQueries`) — that's the actual behavior worth locking down.

### `features/*/components/` and `components/` — UI

Render with `renderWithProviders` (add `<Router>` from wouter if needed), mock the feature hooks the component consumes (`vi.mock("../hooks/useGetUsers")`), query by role/text like a user would, and assert on visible output.

```tsx
// features/users/components/UserList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { UserList } from './UserList'
import { useGetUsers } from '../hooks/useGetUsers'

vi.mock('../hooks/useGetUsers')

describe('UserList', () => {
  it('shows a loading state while fetching', () => {
    vi.mocked(useGetUsers).mockReturnValue({
      isLoading: true,
      data: undefined,
    } as ReturnType<typeof useGetUsers>)

    renderWithProviders(<UserList />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders one item per user once loaded', () => {
    vi.mocked(useGetUsers).mockReturnValue({
      isLoading: false,
      data: [
        { id: '1', name: 'Ada' },
        { id: '2', name: 'Grace' },
      ],
    } as ReturnType<typeof useGetUsers>)

    renderWithProviders(<UserList />)

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Grace')).toBeInTheDocument()
  })
})
```

Query priority (highest to lowest, per Testing Library's own guidance): `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId` (last resort — only when there's genuinely no accessible way to target the element).

### Debounced inputs (`use-debounce`)

Use fake timers and advance them explicitly instead of adding arbitrary `await` delays.

```tsx
// features/users/hooks/useUserSearch.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserSearch } from './useUserSearch'

describe('useUserSearch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('only updates debouncedSearch after the delay elapses', () => {
    const { result } = renderHook(() => useUserSearch())

    act(() => result.current.setSearch('ada'))
    expect(result.current.debouncedSearch).toBe('')

    act(() => vi.advanceTimersByTime(300))
    expect(result.current.debouncedSearch).toBe('ada')
  })
})
```

### Zustand stores

Test the store directly (it's just a hook/function), reset state between tests. If the store is created via `create()`, import the hook and use `.getState()`/`.setState()` for setup/teardown.

```ts
// features/cart/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './store'

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState(useCartStore.getInitialState())
  })

  it('increments item count when addItem is called', () => {
    useCartStore.getState().addItem({ id: '1', price: 10 })
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})
```

(If the store predates `getInitialState`, capture the initial state manually and reset to that snapshot in `beforeEach` instead.)

### Pages (`pages/`)

Test pages sparingly and at a higher level: mock the feature(s) they compose, assert the page renders the right feature components and passes the right props/route params (from wouter) — don't re-test feature-internal behavior here.

## What NOT to do

- Don't call real Firebase from any test — always mock at the `firebase/*` boundary in `api/` tests, or mock the feature's `api/` module everywhere above that layer.
- Don't test implementation details: internal state variables, private functions, or exact number of re-renders.
- Don't assert on Tailwind class names as the primary assertion — assert on visible text/role/state instead; class assertions (if ever needed) are a secondary, rare check.
- Don't share mutable state between tests — each test sets up its own mocks/state; use `beforeEach`/`afterEach` to reset (`vi.clearAllMocks()` in an `afterEach` at minimum).
- Don't snapshot-test whole components as a substitute for real assertions — prefer explicit `expect` calls on meaningful output.

## Coverage expectations when adding a feature

When scaffolding or reviewing a new feature, make sure it has:

1. `api/*.test.ts` — service functions map external data correctly and propagate errors.
2. `hooks/*.test.ts(x)` — query/mutation hooks: loading, success, error, and (for mutations) invalidation.
3. `components/*.test.tsx` — key user-visible states (loading, empty, populated, error) and interactions (clicks, form submission) via `user-event`.
4. Any nontrivial `lib/` helper used by the feature has its own unit tests.

## ESLint & Prettier

Test files follow the same rules as the rest of the codebase (see the architecture skill): no unused imports, consistent import order, no `any`, Prettier formatting authoritative. Additionally:

- No `console.log` left in tests.
- No `.only`/`.skip` committed — these are for local debugging only.
- Every `it`/`test` title should read as a sentence describing behavior ("returns X when Y"), not vague titles like `it("works")`.
