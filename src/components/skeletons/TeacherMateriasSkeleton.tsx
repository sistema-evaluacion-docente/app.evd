import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Bar heights of the fake chart, so it reads as data instead of a grey block. */
const CHART_BARS = [64, 86, 45, 72, 55]

/** Course name widths, so the rows don't read as four identical stamps. */
const COURSE_WIDTHS = ['w-56', 'w-44', 'w-64', 'w-48']

/**
 * Loading placeholder for the teacher "Mis materias" page. Mirrors the real
 * layout — the averages-per-course chart and the course results list — so
 * nothing shifts when the data lands. Pass `withHeader` while the period
 * history is still loading, when the title and the period selector aren't
 * rendered yet either.
 *
 * @example
 * if (isLoading) return <TeacherMateriasSkeleton />
 *
 * @example
 * if (isHistoryPending) return <TeacherMateriasSkeleton withHeader />
 */
function TeacherMateriasSkeleton({ withHeader = false }: { withHeader?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando sus materias…</span>

      {withHeader && (
        <header className="mb-6">
          <div className="mb-3 flex items-center">
            <Skeleton className="h-8 w-24" />
          </div>

          <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-9 w-44" />
          </div>
        </header>
      )}

      <section className="border-border bg-background rounded-md border">
        <div className="border-border border-b px-6 py-4">
          <Skeleton className="h-3.5 w-44" />
        </div>

        <div className="px-6 py-4">
          <div className="flex h-64 items-end gap-4 pt-6 pb-2">
            {CHART_BARS.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex w-full flex-1 items-end justify-center">
                  <Skeleton
                    className="w-full max-w-7 rounded-t-sm rounded-b-none"
                    style={{ height: `${height}%` }}
                  />
                </div>

                <Skeleton className="h-2.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border bg-background rounded-md border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <Skeleton className="h-3.5 w-48" />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Skeleton className="h-2.5 w-24" />

            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center gap-1.5">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="divide-border divide-y">
          {COURSE_WIDTHS.map((width, index) => (
            <div key={index} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="size-4 shrink-0 rounded-sm" />

                <div className="space-y-1.5">
                  <Skeleton className={cn('h-3.5', width)} />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default TeacherMateriasSkeleton
