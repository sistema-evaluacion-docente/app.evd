import { useSearchParams } from 'wouter'

import { parseCategoryId, type CategoryMeta } from '@/lib/categoryLabel'

export interface CategoryFilterResult {
  /** Pedagogical category currently narrowing the page, or `undefined` for all of them. */
  categoryId: CategoryMeta['id'] | undefined
  /** Writes the category into the URL; anything that isn't one clears the filter. */
  setCategoryId: (value: number | string | null | undefined) => void
}

/**
 * Reads and writes the `?category=` filter of the current route, exactly as
 * `useRiskLevelFilter` does for the risk level: the URL owns it so a narrowed
 * read stays linkable — the department summary's category and dimension
 * charts link straight into `/comentarios?category=2` — and survives a
 * reload, and a hand-typed value that isn't a category is ignored rather than
 * forwarded to the API. Writes replace the history entry and keep every other
 * search param intact.
 *
 * @example
 * const { categoryId, setCategoryId } = useCategoryFilter()
 * const { data } = useGetComments({ pedagogicalCategoryId: categoryId })
 */
export function useCategoryFilter(param = 'category'): CategoryFilterResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryId = parseCategoryId(searchParams.get(param))

  const setCategoryId = (value: number | string | null | undefined) => {
    const selected = parseCategoryId(value)

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)

        if (selected) next.set(param, String(selected))
        else next.delete(param)

        return next
      },
      { replace: true },
    )
  }

  return { categoryId, setCategoryId }
}
