import { Building2 } from 'lucide-react'
import { useState } from 'react'

import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetDepartmentCases } from '@/features/departments'
import { useGetFaculties } from '@/features/faculties'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'
import { useGetFacultyAveragesForFaculties } from '../api'
import type { FacultyPeriodAverage } from '../types'
import { OverviewRow } from './OverviewRow'
import { UniversityStatsSummary } from './UniversityStatsSummary'

export interface FacultiesOverviewProps {
  className?: string
}

/**
 * University-wide landing view for VICERRECTOR ACADEMICO, for an academic
 * period of their choosing (the latest one with data by default): university
 * totals, a bar comparison and trend, then every faculty ranked by that
 * period's average. There is no single "university average" endpoint —
 * everything is built from the same per-faculty average
 * (`GET /stats/faculties/{id}/average`) the DECANO's own summary uses, called
 * once per faculty in parallel. Clicking a faculty opens its own page at
 * `/facultades/{id}`. It is the first screen this role lands on, so it has no
 * "go back" button.
 *
 * @example
 * <FacultiesOverview />
 */
export function FacultiesOverview({ className }: FacultiesOverviewProps) {
  const navigate = useNavigate()
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(undefined)
  const { data: facultiesData, isPending: isFacultiesPending, error } = useGetFaculties({
    limit: 100,
  })
  const faculties = facultiesData?.data ?? []

  const averageQueries = useGetFacultyAveragesForFaculties(faculties.map((faculty) => faculty.id))
  const isAveragesPending = averageQueries.some((query) => query.isPending)

  const averagesByFaculty = averageQueries.map((query) => query.data?.data ?? [])

  // Until the reader picks one, the newest period any faculty has data for —
  // the latest academic period overall may still be empty.
  const newestWithData = averagesByFaculty
    .flat()
    .reduce<FacultyPeriodAverage | undefined>(
      (newest, row) =>
        !newest || row.academic_period_code > newest.academic_period_code ? row : newest,
      undefined,
    )
  const effectivePeriodId = selectedPeriodId ?? newestWithData?.academic_period_id

  const rows = faculties
    .map((faculty, index) => ({
      faculty,
      forPeriod: averagesByFaculty[index]?.find(
        (average) => average.academic_period_id === effectivePeriodId,
      ),
    }))
    .sort((a, b) => (b.forPeriod?.global_average ?? -1) - (a.forPeriod?.global_average ?? -1))

  const isPending = isFacultiesPending || isAveragesPending

  const { data: casesData } = useGetDepartmentCases(effectivePeriodId)
  const casesLabel = (facultyId: number) => {
    const rows = (casesData?.data ?? []).filter((row) => row.faculty_id === facultyId)

    if (!casesData) return ''

    const highRisk = rows.reduce((sum, row) => sum + row.high_risk_comments, 0)
    const plans = rows.reduce((sum, row) => sum + row.plans_total, 0)

    return ` · ${highRisk} riesgo alto · ${plans} ${plans === 1 ? 'plan' : 'planes'}`
  }

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle
        backButton={false}
        action={
          effectivePeriodId != null ? (
            <PeriodSelect
              value={effectivePeriodId}
              onValueChange={setSelectedPeriodId}
              ariaLabel="Periodo académico"
            />
          ) : undefined
        }
      >
        Resumen general
      </PageTitle>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      )}

      {!isPending && !error && rows.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay facultades para mostrar.
        </p>
      )}

      {!isPending && !error && rows.length > 0 && effectivePeriodId != null && (
        <>
          <UniversityStatsSummary
            faculties={faculties}
            averagesByFaculty={averagesByFaculty}
            periodId={effectivePeriodId}
          />

          <div className="space-y-3">
            <h2 className="text-foreground text-base font-semibold">Facultades</h2>

            <div className="border-border bg-background divide-border divide-y overflow-hidden rounded-md border shadow-xs">
              {rows.map(({ faculty, forPeriod }, index) => (
                <OverviewRow
                  key={faculty.id}
                  icon={<Building2 aria-hidden="true" />}
                  title={faculty.name}
                  subtitle={
                    forPeriod
                      ? `Periodo ${forPeriod.academic_period_name || forPeriod.academic_period_code}${casesLabel(faculty.id)}`
                      : 'Sin evaluaciones en este periodo'
                  }
                  rank={forPeriod ? index + 1 : undefined}
                  score={forPeriod?.global_average}
                  onClick={() => navigate(`/facultades/${faculty.id}`)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
