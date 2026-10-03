import type { ComponentProps } from 'react'

import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useEvaluatedPeriodOptions } from '../hooks/useEvaluatedPeriodOptions'

export interface EvaluatedPeriodSelectProps extends Omit<
  ComponentProps<typeof PeriodSelect>,
  'options'
> {
  /** Department whose periods are offered. Omit for a director's own department. */
  departmentId?: number | null
}

/**
 * `PeriodSelect` limited to the periods the department actually has
 * evaluations for, instead of the institution-wide `/academic-periods`
 * catalogue — picking a period nobody uploaded only ever showed an empty page.
 * Waits for that list before rendering, so the select never falls back to the
 * global catalogue in between.
 *
 * @example
 * <EvaluatedPeriodSelect value={periodId} onValueChange={setPeriodId} searchParam="period" />
 */
export function EvaluatedPeriodSelect({
  departmentId,
  placeholder,
  disabled,
  className,
  ...props
}: EvaluatedPeriodSelectProps) {
  const { options, isPending } = useEvaluatedPeriodOptions(departmentId)

  if (isPending) return <Spinner className={cn('size-5', className)} />

  return (
    <PeriodSelect
      {...props}
      options={options}
      placeholder={options.length === 0 ? 'Sin periodos evaluados' : placeholder}
      disabled={disabled || options.length === 0}
      className={className}
    />
  )
}
