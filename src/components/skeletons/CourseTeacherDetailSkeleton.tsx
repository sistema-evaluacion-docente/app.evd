import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Row widths of the fake dimension ranking, so it reads as a list of names. */
const DIMENSION_ROWS = ['w-44', 'w-36', 'w-40', 'w-32']

/** Bar heights of the fake dimension breakdown, to avoid a flat grey block. */
const BREAKDOWN_BARS = [72, 54, 88, 46, 66]

/** Line widths of the fake comment bodies, so three blocks are not identical. */
const COMMENT_LINES = [
  ['w-11/12', 'w-7/12'],
  ['w-full', 'w-5/12'],
  ['w-9/12', 'w-8/12'],
]

/**
 * Loading placeholder for one subject of one teacher — the page behind
 * `CourseTeacherDetail`, reached both from the department's Materias list and
 * from a teacher browsing their own periods.
 *
 * It replaces a centred "Cargando…" that used to follow the route skeleton:
 * two loading states in a row, in two different visual languages, read as the
 * page loading twice.
 *
 * @example
 * if (isLoading) return <CourseTeacherDetailSkeleton />
 */
function CourseTeacherDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-busy="true">
      <span className="sr-only">Cargando el detalle de la materia…</span>

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="space-y-1.5 text-right">
            <Skeleton className="ml-auto h-3.5 w-32" />
            <Skeleton className="ml-auto h-2.5 w-20" />
          </div>

          <Skeleton className="size-11 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-background min-w-0 rounded-md border px-6 py-5">
          <Skeleton className="h-2.5 w-48" />
          <Skeleton className="mt-2 h-12 w-32" />
          <Skeleton className="mt-3 h-8 w-56" />
          <Skeleton className="mt-4 h-5 w-44 rounded-full" />
        </div>

        <div className="border-border bg-background flex flex-col rounded-md border px-5 py-5">
          <Skeleton className="mb-3 h-2.5 w-44" />

          <ol className="flex-1 space-y-3">
            {DIMENSION_ROWS.map((width, index) => (
              <li key={index} className="flex items-center gap-2.5">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className={cn('h-3.5', width)} />
                <Skeleton className="ml-auto h-4 w-10 shrink-0" />
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap gap-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center gap-1.5">
                <Skeleton className="size-1.5 rounded-full" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Panel headerWidth="w-52">
        <div className="flex h-40 items-end gap-4 px-2">
          {BREAKDOWN_BARS.map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-32 w-full items-end justify-center">
                <Skeleton
                  className="w-full max-w-10 rounded-t-sm rounded-b-none"
                  style={{ height: `${height}%` }}
                />
              </div>

              <Skeleton className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel headerWidth="w-56" bodyClassName="px-6 py-0">
        <div className="divide-border/70 divide-y">
          {COMMENT_LINES.map(([first, second], index) => (
            <div key={index} className="space-y-2 py-5">
              <Skeleton className={cn('h-3.5', first)} />
              <Skeleton className={cn('h-3.5', second)} />

              <div className="flex items-center gap-2.5 pt-1.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel headerWidth="w-64">
        <Skeleton className="h-64 w-full rounded-md" />
      </Panel>
    </div>
  )
}

/** Bordered section with a hairline header, matching the real panels. */
function Panel({
  headerWidth,
  bodyClassName = 'px-6 py-4',
  children,
}: {
  headerWidth: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-background rounded-md border">
      <div className="border-border border-b px-6 py-4">
        <Skeleton className={cn('h-3.5', headerWidth)} />
      </div>

      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export default CourseTeacherDetailSkeleton
