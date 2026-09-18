import { useState } from 'react'

import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useGetFacultyAverages } from '../api'
import { FacultyCasesSummary } from './FacultyCasesSummary'
import { FacultyDepartmentsComparison } from './FacultyDepartmentsComparison'
import { FacultyDepartmentsOverview } from './FacultyDepartmentsOverview'
import { FacultyStatsHero } from './FacultyStatsHero'

export interface FacultyPeriodSummaryProps {
  facultyId: number
  /** Renders the "go back" button above the title. Turn it off where this is the landing page. Defaults to `true`. */
  backButton?: boolean
  /** Adds the ranked list of the faculty's departments below the comparison. Defaults to `false`. */
  showDepartmentsList?: boolean
  className?: string
}

/**
 * Self-contained widget with one faculty's averages for an academic period
 * of the reader's choosing (the latest one with data by default): the
 * headline figure against the previous period, the trend over every period
 * it has data for (`GET /stats/faculties/{faculty_id}/average`), and a bar
 * comparison of its departments in that period. Used for a DECANO's own
 * faculty on their home and for any faculty a VICERRECTOR ACADEMICO opens.
 *
 * @example
 * <FacultyPeriodSummary facultyId={user.faculty_id} backButton={false} showDepartmentsList />
 */
export function FacultyPeriodSummary({
  facultyId,
  backButton = true,
  showDepartmentsList = false,
  className,
}: FacultyPeriodSummaryProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(undefined)
  const { data, isPending, error } = useGetFacultyAverages(facultyId)
  // The backend returns every period the faculty has data for — oldest
  // first, same convention as `DepartmentPeriodRangeStats.period_averages`.
  const averages = data?.data ?? []

  // Until the reader picks one, the newest period with data — the latest
  // academic period overall may still be empty.
  const effectivePeriodId = selectedPeriodId ?? averages[averages.length - 1]?.academic_period_id
  const selectedIndex = averages.findIndex((period) => period.academic_period_id === effectivePeriodId)
  const selected = selectedIndex >= 0 ? averages[selectedIndex] : undefined
  const previous = selectedIndex > 0 ? averages[selectedIndex - 1] : undefined

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle
        backButton={backButton}
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
        Resumen de la facultad
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
          <FacultyStatsHero latest={selected} previousValue={previous?.global_average ?? undefined} />

          <FacultyCasesSummary facultyId={facultyId} periodId={selected.academic_period_id} />

          <FacultyDepartmentsComparison
            facultyId={facultyId}
            periodId={selected.academic_period_id}
            facultyAverage={selected.global_average ?? undefined}
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
                      id: 'faculty',
                      label: 'Promedio de la facultad',
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

          {showDepartmentsList && (
            <FacultyDepartmentsOverview
              facultyId={facultyId}
              periodId={selected.academic_period_id}
            />
          )}
        </div>
      )}

      {!isPending && !error && averages.length > 0 && !selected && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Esta facultad no tiene evaluaciones analizadas en el periodo seleccionado.
        </p>
      )}

      {!isPending && !error && averages.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Esta facultad todavía no tiene evaluaciones cargadas.
        </p>
      )}
    </div>
  )
}
