import { useSearchParams } from 'wouter'

import { parseRiskLevelId, type RiskLevelMeta } from '@/lib/riskLevel'

export interface RiskLevelFilterResult {
  /** Risk level currently narrowing the page, or `undefined` for all of them. */
  riskLevel: RiskLevelMeta['id'] | undefined
  /** Writes the risk level into the URL; anything that isn't one clears the filter. */
  setRiskLevel: (value: number | string | null | undefined) => void
}

/**
 * Reads and writes the `?riskLevel=` filter of the current route, exactly as
 * `useModalityFilter` does for the modality: the URL owns it so a narrowed
 * read stays linkable — the department summary's risk chart links straight
 * into `/comentarios?riskLevel=3` — and survives a reload, and a hand-typed
 * value that isn't a level is ignored rather than forwarded to the API.
 * Writes replace the history entry and keep every other search param intact.
 *
 * @example
 * const { riskLevel, setRiskLevel } = useRiskLevelFilter()
 * const { data } = useGetComments({ riskLevel })
 */
export function useRiskLevelFilter(param = 'riskLevel'): RiskLevelFilterResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const riskLevel = parseRiskLevelId(searchParams.get(param))

  const setRiskLevel = (value: number | string | null | undefined) => {
    const selected = parseRiskLevelId(value)

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

  return { riskLevel, setRiskLevel }
}
