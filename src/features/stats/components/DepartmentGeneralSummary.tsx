import { useState } from 'react'

import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useGetDepartmentAverages } from '../api'
import { DepartmentFacultyContext } from './DepartmentFacultyContext'
import { DepartmentGeneralHero } from './DepartmentGeneralHero'

export interface DepartmentGeneralSummaryProps {
  departmentId: number
  className?: string
}

/**
 * Read-only, general-only summary of a single department for one academic
 * period of the reader's choosing (the latest one with data by default),
 * with the whole history as a trend (`GET /stats/departments/averages?department_id=`)
 * and its standing within its faculty. This is the VICERRECTOR ACADEMICO/DECANO
 * view of a department they don't manage: no comments, no pedagogical
 * dimensions, no per-subject or per-teacher breakdown — see
 * `DepartmentPeriodRangeSummary` for the director's own, full view. The
 * backend scopes a DECANO to their own faculty's departments on its own
 * (403 otherwise), so no extra access check is needed here.
 *
 * @example
 * <DepartmentGeneralSummary departmentId={department.id} />
 */
export function DepartmentGeneralSummary({ departmentId, className }: DepartmentGeneralSummaryProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(undefined)
  const { data, isPending, error } = useGetDepartmentAverages(departmentId)
  // The backend orders this endpoint newest-period-first — reverse it to the
  // oldest-first convention `useGetFacultyAverages` already established.
  const averages = [...(data?.data ?? [])].reverse()

  // Until the reader picks one, show the newest period this department has
  // data for — the latest academic period overall may still be empty.
  const effectivePeriodId = selectedPeriodId ?? averages[averages.length - 1]?.academic_period_id
  const selectedIndex = averages.findIndex((period) => period.academic_period_id === effectivePeriodId)
  const selected = selectedIndex >= 0 ? averages[selectedIndex] : undefined
  const previous = selectedIndex > 0 ? averages[selectedIndex - 1] : undefined

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle
        action={
          averages.length > 0 ? (
            <PeriodSelect
              value={effectivePeriodId}
              onValueChange={setSelectedPeriodId}
              ariaLabel="Periodo académico"
            />
          ) : undefined
        }
      >
        Resumen del departamento
      </PageTitle>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-72 w-full rounded-md" />
        </div>
      )}

      {!isPending && !error && selected && (
        <div className="space-y-6">
          <DepartmentGeneralHero
            latest={selected}
            previousValue={previous?.global_average ?? undefined}
          />

          <DepartmentFacultyContext
            departmentId={departmentId}
            periodId={selected.academic_period_id}
          />

          {averages.length > 1 && (
            <section className="border-border bg-background rounded-md border">
              <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
                Evolución del promedio por periodo
              </h2>

              <div className="px-6 py-4">
                <AverageTrendChart
                  series={[
                    {
                      id: 'department',
                      label: 'Promedio del departamento',
                      data: averages.map((period) => ({
                        x: period.academic_period_name || period.academic_period_code,
                        value: period.global_average,
                      })),
                    },
                  ]}
                  referenceValue={selected.global_average ?? undefined}
                  referenceLabel="Periodo seleccionado"
                />
              </div>
            </section>
          )}
        </div>
      )}

      {!isPending && !error && averages.length > 0 && !selected && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Este departamento no tiene evaluaciones analizadas en el periodo seleccionado.
        </p>
      )}

      {!isPending && !error && averages.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Este departamento todavía no tiene evaluaciones cargadas.
        </p>
      )}
    </div>
  )
}
