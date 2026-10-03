import type { PeriodSelectOption } from '@/components/common/PeriodSelect'
import { useGetDepartmentEvaluatedPeriods } from '../api'

export interface EvaluatedPeriodOptionsResult {
  /** The department's evaluated periods, newest first, ready for `PeriodSelect`. */
  options: PeriodSelectOption[]
  isPending: boolean
}

/**
 * The periods a department has evaluations for (`GET /stats/departments/periods`),
 * shaped as `PeriodSelect` options — `name` falls back to the code, since the
 * select, its labels and the `?period=` links all read it. A director's
 * department is implicit; everyone else passes theirs.
 *
 * @example
 * const { options, isPending } = useEvaluatedPeriodOptions()
 * if (!isPending && options.length === 0) return <p>Aún no hay evaluaciones.</p>
 */
export function useEvaluatedPeriodOptions(
  departmentId?: number | null,
): EvaluatedPeriodOptionsResult {
  const { data, isPending } = useGetDepartmentEvaluatedPeriods({
    departmentId: departmentId ?? undefined,
  })

  const options = (data?.data ?? []).map((period) => ({
    id: period.id,
    code: period.code,
    name: period.name ?? period.code,
  }))

  return { options, isPending }
}
