import { useSearchParams } from 'wouter'

import { parseModality, type CourseModality } from '@/lib/modality'

export interface ModalityFilterResult {
  /** Modality currently narrowing the page, or `undefined` for all of them. */
  modality: CourseModality | undefined
  /** Writes the modality into the URL; anything that isn't one clears the filter. */
  setModality: (value: string | null | undefined) => void
}

/**
 * Reads and writes the `?modality=` filter of the current route. The URL owns
 * it so a narrowed report stays linkable and survives a reload, and a
 * hand-typed value that isn't a modality is ignored rather than forwarded to
 * the API. Writes replace the history entry — switching filters is not a step
 * to walk back through — and keep every other search param intact.
 *
 * @example
 * const { modality, setModality } = useModalityFilter()
 * const { data } = useGetEvaluation(evaluationId, modality)
 */
export function useModalityFilter(param = 'modality'): ModalityFilterResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const modality = parseModality(searchParams.get(param))

  const setModality = (value: string | null | undefined) => {
    const selected = parseModality(value)

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)

        if (selected) next.set(param, selected)
        else next.delete(param)

        return next
      },
      { replace: true },
    )
  }

  return { modality, setModality }
}
