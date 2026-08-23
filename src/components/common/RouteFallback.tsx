import { Skeleton } from '@/components/ui/skeleton'

/**
 * What fills the content area while the chunk of a route is on its way.
 *
 * Every page is loaded on demand, so between clicking a link and the page
 * painting there is a request. Left blank the app reads as broken; this holds
 * the shape of a page instead — and says so out loud, because a screen reader
 * gets nothing at all out of grey rectangles.
 *
 * Deliberately generic: it stands in for thirty different pages, and a skeleton
 * that promised the layout of one of them would be wrong on the other twenty-nine.
 */
export function RouteFallback() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Cargando la página…</span>

      <Skeleton className="h-7 w-64" />

      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <Skeleton className="h-64 w-full" />
    </div>
  )
}
