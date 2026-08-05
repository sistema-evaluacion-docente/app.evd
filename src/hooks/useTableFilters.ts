import { createStore, useStore } from 'zustand'

export type TableFiltersValues = Record<string, unknown>

interface TableFiltersState {
  filters: TableFiltersValues
  setFilters: (values: TableFiltersValues) => void
  resetFilters: (defaults?: TableFiltersValues) => void
}

function createTableFiltersStore(defaults: TableFiltersValues = {}) {
  return createStore<TableFiltersState>((set) => ({
    filters: { ...defaults },
    setFilters: (values) => set({ filters: values }),
    resetFilters: (resetTo) => set({ filters: { ...(resetTo ?? defaults) } }),
  }))
}

const storeRegistry = new Map<string, ReturnType<typeof createTableFiltersStore>>()

function getStore(tableKey: string, defaults: TableFiltersValues) {
  let store = storeRegistry.get(tableKey)
  if (!store) {
    store = createTableFiltersStore(defaults)
    storeRegistry.set(tableKey, store)
  }
  return store
}

/**
 * Persists table filter values in a scoped Zustand store so they survive
 * component unmounts (e.g. navigating away and back). Each `tableKey` gets
 * its own isolated store instance, lazily created on first call.
 *
 * @param tableKey Unique identifier for the table (e.g. `"teachers"`, `"evaluations"`).
 * @param defaults Default filter values used on first mount and after `resetFilters()`.
 * @returns The current filter values, a setter, and a reset function.
 *
 * @example
 * const { filters, setFilters, resetFilters } = useTableFilters('teachers', {
 *   active: undefined,
 *   sortBy: 'name_desc',
 * })
 */
export function useTableFilters(tableKey: string, defaults: TableFiltersValues = {}) {
  const store = getStore(tableKey, defaults)

  const filters = useStore(store, (state) => state.filters)
  const setFilters = useStore(store, (state) => state.setFilters)
  const resetFilters = useStore(store, (state) => state.resetFilters)

  return { filters, setFilters, resetFilters }
}
