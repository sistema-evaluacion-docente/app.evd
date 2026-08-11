import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Fake header widths for the fake dimension rows, so it reads as data, not as blocks. */
const ROW_WIDTHS = ['w-48', 'w-56', 'w-40', 'w-52']

/**
 * Loading placeholder for the evaluation dimensions detail page. Mirrors the
 * real layout — the period hero, the overview chart, the filter toolbar and
 * the collapsed dimension rows — so nothing shifts when the data lands, and
 * reveals each block in a staggered wave instead of flashing at once.
 *
 * @example
 * if (isLoading) return <EvaluationDimensionsDetailSkeleton />
 */
function EvaluationDimensionsDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando el detalle por dimensiones…</span>

      <Skeleton className="h-8 w-28" />

      <div className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
        <div className="bg-muted/40 flex flex-wrap items-center gap-2 px-6 py-3">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-2.5 w-40" />
          </div>

          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>
      </div>

      <div
        className="border-border bg-background rounded-md border"
        style={{ animationDelay: '60ms' }}
      >
        <div className="border-border border-b px-6 py-4">
          <Skeleton className="h-3.5 w-48" />
        </div>

        <div className="px-6 py-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3" style={{ animationDelay: '120ms' }}>
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      <div
        className="border-border bg-background rounded-md border"
        style={{ animationDelay: '180ms' }}
      >
        <div className="border-border border-b px-6 py-4">
          <Skeleton className="h-3.5 w-32" />
        </div>

        <div className="divide-border divide-y">
          {ROW_WIDTHS.map((width, index) => (
            <div key={index} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className={cn('h-4', width)} />
              </div>

              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EvaluationDimensionsDetailSkeleton
