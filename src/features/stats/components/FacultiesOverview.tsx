import { Building2 } from 'lucide-react'

import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetFaculties } from '@/features/faculties'
import { cn } from '@/lib/utils'
import { useGetFacultyAveragesForFaculties } from '../api'

export interface FacultiesOverviewProps {
  className?: string
}

/**
 * University-wide landing view for VICERRECTOR ACADEMICO: every faculty
 * ranked by its most recent evaluated period's global average. There is no
 * single "university average" endpoint — this is built from the same
 * per-faculty average (`GET /stats/faculties/{id}/average`) the DECANO's own
 * summary uses, called once per faculty in parallel.
 *
 * @example
 * <FacultiesOverview />
 */
export function FacultiesOverview({ className }: FacultiesOverviewProps) {
  const { data: facultiesData, isPending: isFacultiesPending, error } = useGetFaculties({
    limit: 100,
  })
  const faculties = facultiesData?.data ?? []

  const averageQueries = useGetFacultyAveragesForFaculties(faculties.map((faculty) => faculty.id))
  const isAveragesPending = averageQueries.some((query) => query.isPending)

  const rows = faculties
    .map((faculty, index) => {
      const averages = averageQueries[index]?.data?.data ?? []
      const latest = averages[averages.length - 1]
      return { faculty, latest }
    })
    .sort((a, b) => (b.latest?.global_average ?? -1) - (a.latest?.global_average ?? -1))

  const isPending = isFacultiesPending || isAveragesPending

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle>Resumen general</PageTitle>

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

      {!isPending && !error && rows.length > 0 && (
        <div className="border-border divide-border divide-y overflow-hidden rounded-md border">
          {rows.map(({ faculty, latest }) => (
            <div
              key={faculty.id}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Building2 className="text-muted-foreground size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-foreground truncate font-medium">{faculty.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {latest
                      ? `Periodo ${latest.academic_period_name || latest.academic_period_code}`
                      : 'Sin evaluaciones cargadas'}
                  </p>
                </div>
              </div>

              {latest && (
                <ScoreBadge value={latest.global_average ?? undefined} tone="auto" size="lg" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
