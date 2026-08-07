import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholder for the evaluation detail page. Mirrors the real layout
 * — context strip, hero and the four hairline-separated facts — so nothing
 * shifts when the data lands.
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
    </div>
  )
}

export default EvaluationDetailSkeleton
