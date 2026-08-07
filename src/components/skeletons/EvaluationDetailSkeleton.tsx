import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Bar widths of the fake dimension chart, so it reads as data, not as blocks. */
const DIMENSION_BARS = ['w-10/12', 'w-7/12', 'w-9/12', 'w-6/12']

/**
 * Loading placeholder for the evaluation detail page. Mirrors the real layout
 * — context strip, hero, the hairline-separated facts and the per-dimension
 * chart — so nothing shifts when the data lands, and reveals both blocks in a
 * staggered wave instead of flashing at once.
 *
 * @example
 * if (isLoading) return <EvaluationDetailSkeleton />
 */
function EvaluationDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando el detalle de la evaluación…</span>

      <Skeleton className="h-8 w-28" />

      <div className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          <Skeleton className="h-8 w-28" />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-2.5 w-44" />
          </div>

          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>

        <div className="divide-border grid grid-cols-2 divide-x sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 px-6 py-4">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className={index === 0 ? 'h-7 w-12' : 'h-6 w-24 rounded-full'} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="border-border bg-background rounded-md border"
        style={{ animationDelay: '80ms' }}
      >
        <div className="border-border border-b px-6 py-4">
          <Skeleton className="h-3.5 w-64" />
        </div>

        <div className="space-y-4 px-6 py-6">
          {DIMENSION_BARS.map((width, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-2.5 w-24 shrink-0" />

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className={cn('h-5 rounded-sm', width)} />
                <Skeleton className="h-2.5 w-8 shrink-0" />
              </div>
            </div>
          ))}

          <Skeleton className="mt-2 h-2.5 w-full" />
        </div>
      </div>
    </div>
  )
}

export default EvaluationDetailSkeleton
