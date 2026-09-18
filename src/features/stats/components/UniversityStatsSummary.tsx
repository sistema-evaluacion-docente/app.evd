import type { ReactNode } from 'react'

import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { RankedBarChart } from '@/components/common/RankedBarChart'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { useGetDepartmentUploads } from '@/features/departments'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'
import type { FacultyPeriodAverage } from '../types'

export interface UniversityStatsSummaryProps {
  /** Every faculty, in the same order as `averagesByFaculty`. */
  faculties: { id: number; name: string }[]
  /** Each faculty's per-period averages, aligned with `faculties`. */
  averagesByFaculty: FacultyPeriodAverage[][]
  /** Academic period the summary is read for. */
  periodId: number
  className?: string
}

interface PeriodTotals {
  code: string
  label: string
  id: number
  scoreSum: number
  evaluations: number
  respondents: number
}

/**
 * University-wide read for the VICERRECTOR ACADEMICO in one academic period,
 * built only from data they can already read: the overall average (each
 * faculty weighted by its evaluations, so it equals the average of every
 * evaluation) against the previous period, how many evaluations and
 * respondents back it, how many faculties and departments have reported, a
 * bar comparison of every faculty, and the university average over time.
 *
 * @example
 * <UniversityStatsSummary faculties={faculties} averagesByFaculty={results} periodId={12} />
 */
export function UniversityStatsSummary({
  faculties,
  averagesByFaculty,
  periodId,
  className,
}: UniversityStatsSummaryProps) {
  const navigate = useNavigate()
  const totalsByPeriod = new Map<number, PeriodTotals>()

  for (const row of averagesByFaculty.flat()) {
    if (row.global_average == null) continue

    const totals = totalsByPeriod.get(row.academic_period_id) ?? {
      code: row.academic_period_code,
      label: row.academic_period_name || row.academic_period_code,
      id: row.academic_period_id,
      scoreSum: 0,
      evaluations: 0,
      respondents: 0,
    }

    totals.scoreSum += row.global_average * row.evaluation_count
    totals.evaluations += row.evaluation_count
    totals.respondents += row.total_respondents
    totalsByPeriod.set(row.academic_period_id, totals)
  }

  const periods = [...totalsByPeriod.values()].sort((a, b) => a.code.localeCompare(b.code))
  const selectedIndex = periods.findIndex((period) => period.id === periodId)
  const selected = selectedIndex >= 0 ? periods[selectedIndex] : undefined
  const previous = selectedIndex > 0 ? periods[selectedIndex - 1] : undefined

  const average = (totals?: PeriodTotals) =>
    totals && totals.evaluations > 0 ? totals.scoreSum / totals.evaluations : undefined

  const { data: uploadsData } = useGetDepartmentUploads(periodId)
  const uploads = uploadsData?.data ?? []
  const uploadedCount = uploads.filter((department) => department.has_uploaded).length

  const facultyRows = faculties.map((faculty, index) => ({
    faculty,
    row: averagesByFaculty[index]?.find((row) => row.academic_period_id === periodId),
  }))
  const facultiesWithData = facultyRows.filter(({ row }) => row?.global_average != null).length

  if (!selected) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm', className)}>
        Ninguna facultad tiene evaluaciones analizadas en el periodo seleccionado.
      </p>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <section className="border-border bg-background divide-border grid grid-cols-2 divide-x divide-y overflow-hidden rounded-md border lg:grid-cols-4 lg:divide-y-0">
        <Fact label="Promedio de la universidad">
          <ScoreBadge
            value={average(selected)}
            previousValue={average(previous)}
            tone="auto"
            size="3xl"
            className="leading-none"
          />
          <span className="text-muted-foreground text-xs">Periodo {selected.label}</span>
        </Fact>

        <Fact label="Evaluaciones analizadas">
          <span className="text-3xl font-semibold tabular-nums">{selected.evaluations}</span>
          <span className="text-muted-foreground text-xs">{selected.respondents} respondientes</span>
        </Fact>

        <Fact label="Facultades con datos">
          <span className="text-3xl font-semibold tabular-nums">
            {facultiesWithData}
            <span className="text-muted-foreground text-lg font-normal"> / {faculties.length}</span>
          </span>
        </Fact>

        <Fact label="Departamentos que subieron">
          <span className="text-3xl font-semibold tabular-nums">
            {uploadedCount}
            <span className="text-muted-foreground text-lg font-normal"> / {uploads.length}</span>
          </span>
          <span className="text-muted-foreground text-xs">en {selected.label}</span>
        </Fact>
      </section>

      <section className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          Comparación de facultades · {selected.label}
        </h2>

        <div className="px-3 py-4 sm:px-6">
          <RankedBarChart
            items={facultyRows.map(({ faculty, row }) => ({
              key: String(faculty.id),
              label: faculty.name,
              value: row?.global_average,
            }))}
            referenceValue={average(selected)}
            referenceLabel="Promedio de la universidad"
            itemsLabel="facultades"
            onItemClick={(key) => navigate(`/facultades/${key}`)}
          />
        </div>
      </section>

      {periods.length > 1 && (
        <section className="border-border bg-background rounded-md border">
          <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
            Evolución del promedio de la universidad
          </h2>

          <div className="px-6 py-4">
            <AverageTrendChart
              categories={periods.map((period) => period.label)}
              series={[
                {
                  id: 'university',
                  label: 'Promedio de la universidad',
                  data: periods.map((period) => ({
                    x: period.label,
                    value: average(period) ?? null,
                  })),
                },
              ]}
              referenceValue={average(selected)}
              referenceLabel="Periodo seleccionado"
            />
          </div>
        </section>
      )}
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      {children}
    </div>
  )
}
