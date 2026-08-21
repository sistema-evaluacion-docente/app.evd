---
name: reuse-before-creating
description: Use this skill at the START of every task that involves writing new code in this React project — a new page, feature, component, hook, api/service function, util, type, or store. Before creating anything new, search the existing codebase for something that already does it (or almost does it) and reuse or extend it instead of writing it from scratch. Trigger this on any request phrased as "create/add/build/implement X", "make a new page/component/hook for Y", or any task from the react-feature-sliced-architecture or react-testing-vitest skills that involves adding code. Do not skip this even for requests that sound small ("just add a loading spinner", "add a hook to fetch Z") — those are exactly the cases most likely to already exist somewhere in the codebase.
---

# Reuse Before Creating

Before writing a single new component, hook, api function, util, type, or store, do a discovery pass over the existing codebase. Only create something new once you've confirmed nothing suitable already exists — and if something _close_ exists, extend it instead of duplicating it. This applies on top of, and before, whatever the current task's other skills (e.g. `react-feature-sliced-architecture`, `react-testing-vitest`) tell you to build.

## Why this matters

Duplicated components/hooks/utils are the fastest way this codebase rots: two slightly different `useDebounce` wrappers, three date formatters, two "empty state" components with different props. Every new piece of code is a maintenance liability — the cheapest code is the code you don't write.

## Discovery checklist (run this before creating anything)

Do this for **every** artifact you're about to create — component, hook, api function, util, type, store — not just once per task.

1. **Search by intent, not by the exact name you're about to use.** Search for the concept in multiple phrasings before concluding nothing exists:
   - What it _does_: "debounce", "format date", "empty state", "period selector", "pagination"
   - What it's _for_: the domain noun ("teacher", "user", "period") combined with the action ("get", "list", "create", "filter")
   - Common synonyms: `loading` / `spinner` / `skeleton`; `error` / `fallback`; `card` / `item` / `row`; `select` / `picker` / `dropdown`

2. **Look in the right places for each artifact type:**

   | Looking for...                                            | Search first in...                                                                                                                       |
   | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
   | Component (generic/shared)                                | `components/`                                                                                                                            |
   | Component (domain-specific)                               | `features/<relevant-feature>/components/`, and skim sibling features for a similar pattern (e.g. another feature's "detail page" layout) |
   | Custom hook (React Query)                                 | `features/*/hooks/` — same domain feature first, then similar features                                                                   |
   | Custom hook (other, e.g. debounce/search/filter wrappers) | `features/*/hooks/`, `lib/`                                                                                                              |
   | Api/service function                                      | `features/<feature>/api/`                                                                                                                |
   | Util/formatter/helper                                     | `lib/` first, always — this is its whole purpose                                                                                         |
   | Type/interface                                            | `features/<feature>/types/`, `lib/types.ts` or equivalent shared types file                                                              |
   | Zustand store                                             | co-located feature store, or a shared `store/`/`config/` location if it's app-wide                                                       |
   | Route/path constant                                       | `config/routes.ts`                                                                                                                       |
   | Query key factory                                         | next to the feature's query hooks (see `react-feature-sliced-architecture`)                                                              |

3. **Use real search, not memory or assumption.** Grep/search the codebase (filenames, exported symbol names, and text content) rather than assuming something does or doesn't exist. If the project is large, search iteratively: broad term first, then narrow based on what turns up.

4. **Check each feature's `index.ts`** to see its full public surface at a glance — this is usually the fastest way to see what a feature already exposes before diving into its internals.

5. **If you find something close but not exact**, read it fully before deciding. Then choose one of:
   - **Reuse as-is** — call/import it directly, no changes needed.
   - **Extend it** — add a parameter/prop/option so it covers the new case too, without breaking existing callers. Prefer this over a near-duplicate.
   - **Generalize it** — if a feature-scoped component/hook is now needed by a second feature, promote it to the shared `components/`/`lib/` layer (moving it, not copying it), then update the original usage to import from the new shared location.
   - **Create new** — only when none of the above apply. State briefly why nothing existing fit.

## What counts as "close enough to extend"

- Same shape of data, different filter/param (e.g. an existing `useGetTeachers` that just needs a `period` param added) → extend.
- Same UI pattern, different content (e.g. an existing `EmptyState` component that takes a `message` prop) → reuse with new props, don't build a second empty-state component.
- Same formatting need with a different date/number shape → add a parameter to the existing `lib/` helper, don't write a new one.
- Genuinely different domain concern with only superficial resemblance (e.g. a "teacher card" vs a "user card" that happen to both show a name and avatar but diverge in every other field/action) → creating new is fine, but still consider extracting the truly shared bit (e.g. the avatar+name row) into `components/`.

## Rules

- Never create a new component/hook/util whose behavior is a near-copy of an existing one just because it lives in a different feature — extend or generalize instead.
- Never redefine a type that already exists elsewhere for the same entity — import and reuse it (extend with `Pick`/`Omit`/intersection types if you only need part of it or a variant).
- Never add a second date/number formatter, debounce wrapper, or similar `lib/` utility that does the same job as an existing one with slightly different formatting — parameterize the existing one.
- Never hardcode a route path that already has a constant in `config/routes.ts`, and never add a second constant for the same route.
- If extending shared code (`components/`, `lib/`, or a feature's public `index.ts` exports) risks breaking existing callers, check those callers first and keep the change backward-compatible (new optional param with a sensible default, not a breaking signature change) unless told otherwise.

## Reporting back

At the end of the task, briefly state:

- What you reused as-is.
- What you extended (and what you added to it).
- What you created new, and why nothing existing covered it.

This isn't optional bookkeeping — it's what lets whoever reviews the change verify you actually looked before building.
