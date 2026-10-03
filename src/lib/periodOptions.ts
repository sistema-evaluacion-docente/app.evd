import type { PeriodSelectOption } from '@/components/common/PeriodSelect'

interface PeriodRow {
  academic_period_id: number
  academic_period_code: string
  academic_period_name: string | null
}

/**
 * `PeriodSelect` options made of the periods a set of stats rows actually
 * covers — one per period, however many rows share it — so a summary only
 * offers periods it has numbers for, not the whole `/academic-periods`
 * catalogue.
 *
 * @example
 * <PeriodSelect options={periodOptionsFrom(averages)} value={periodId} />
 */
export function periodOptionsFrom(rows: PeriodRow[]): PeriodSelectOption[] {
  const byId = new Map<number, PeriodSelectOption>()

  for (const row of rows) {
    if (byId.has(row.academic_period_id)) continue

    byId.set(row.academic_period_id, {
      id: row.academic_period_id,
      code: row.academic_period_code,
      name: row.academic_period_name ?? row.academic_period_code,
    })
  }

  return [...byId.values()]
}
