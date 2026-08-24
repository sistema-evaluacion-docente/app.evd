import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Dimension name widths, so the ranking rows don't read as identical stamps. */
const DIMENSION_WIDTHS = ['w-40', 'w-52', 'w-36', 'w-44']

/** Question label widths for the expanded-looking breakdown rows. */
const BREAKDOWN_WIDTHS = ['w-48', 'w-36', 'w-56', 'w-44', 'w-40']

/** Bar heights of the fake trend chart, so it reads as data instead of a grey block. */
const TREND_BARS = [58, 74, 46, 82, 63, 70]

/**
 * Loading placeholder for `CourseTeacherDetail`. Mirrors the real report —
 * header, average card, dimension ranking, dimension breakdown, comments and
 * the subject's trend chart — so nothing shifts when the data lands. Pass
 * `withTeacherIdentity` in the director's view, where the teacher header and
 * the report button are rendered too.
 *
 * @example
 * if (isLoading) return <CourseTeacherDetailSkeleton />
 *
 * @example
 * if (isLoading) return <CourseTeacherDetailSkeleton withTeacherIdentity />
 */
function CourseTeacherDetailSkeleton({
  withTeacherIdentity = false,
  className,
}: {
  withTeacherIdentity?: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-busy="true">
      <span className="sr-only">Cargando la información de la materia…</span>

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-72 sm:h-9" />
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>

          <Skeleton className="mt-2.5 h-3.5 w-44" />
        </div>

        {withTeacherIdentity && (
          <div className="inline-flex w-fit shrink-0 items-center gap-3 lg:flex-row-reverse">
            <Skeleton className="size-12 shrink-0 rounded-full" />

            <div className="space-y-1.5 lg:flex lg:flex-col lg:items-end">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        )}
      </div>

      {withTeacherIdentity && <Skeleton className="h-9 w-64 shrink-0" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-background min-w-0 flex-1 rounded-md border px-6 py-5">
          <Skeleton className="h-3 w-52" />
          <Skeleton className="mt-2 h-12 w-40" />
          <Skeleton className="mt-3 h-8 w-64" />
          <Skeleton className="mt-4 h-5 w-48 rounded-full" />
        </div>

        <div className="border-border bg-background flex w-full shrink-0 flex-col rounded-md border px-5 py-5">
          <Skeleton className="mb-3 h-3 w-40" />

          <div className="flex flex-1 items-stretch gap-3">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="w-0.5 flex-1 rounded-full" />
              <Skeleton className="h-2.5 w-10" />
            </div>

            <ol className="flex flex-1 flex-col justify-center space-y-3">
              {DIMENSION_WIDTHS.map((width, index) => (
                <li key={index} className="flex items-center gap-2.5">
                  <Skeleton className="size-2 shrink-0 rounded-full" />
                  <Skeleton className={cn('h-3.5 min-w-0 flex-1', width)} />
                  <Skeleton className="h-4 w-10 shrink-0" />
                </li>
              ))}
            </ol>
          </div>

          <LegendSkeleton className="mt-4" />
        </div>
      </div>

      <section className="border-border bg-background rounded-md border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <Skeleton className="h-3.5 w-52" />
          <LegendSkeleton />
        </div>

        <div className="divide-border divide-y px-6">
          {BREAKDOWN_WIDTHS.map((width, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="size-3.5 shrink-0" />
                <Skeleton className="size-1.5 shrink-0 rounded-full" />
                <Skeleton className={cn('h-3', width)} />
              </div>

              <Skeleton className="h-5 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-background rounded-md border">
        <div className="border-border border-b px-6 py-4">
          <Skeleton className="h-3.5 w-56" />
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
        </div>

        <div className="space-y-3 px-6 py-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border-border space-y-2 rounded-md border p-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />

              <div className="flex flex-wrap gap-2 pt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-background rounded-md border">
        <div className="border-border border-b px-6 py-4">
          <Skeleton className="h-3.5 w-64" />
        </div>

        <div className="px-6 py-4">
          <div className="flex h-56 items-end gap-4 pt-6 pb-2">
            {TREND_BARS.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex w-full flex-1 items-end justify-center">
                  <Skeleton
                    className="w-full max-w-7 rounded-t-sm rounded-b-none"
                    style={{ height: `${height}%` }}
                  />
                </div>

                <Skeleton className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/** Fake `ScoreLegend`: the label plus its three colored thresholds. */
function LegendSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      <Skeleton className="h-2.5 w-24" />

      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-1.5">
          <Skeleton className="size-2 shrink-0 rounded-full" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      ))}
    </div>
  )
}

export default CourseTeacherDetailSkeleton
