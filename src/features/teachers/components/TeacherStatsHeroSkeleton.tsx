import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface TeacherStatsHeroSkeletonProps {
  className?: string
}

/**
 * Loading placeholder for `TeacherStatsHero` — same section, strip, avatar,
 * name/average row and three-column count strip, so the dashboard keeps its
 * layout when the history lands.
 *
 * @example
 * if (isPending) return <TeacherStatsHeroSkeleton />
 */
export function TeacherStatsHeroSkeleton({ className }: TeacherStatsHeroSkeletonProps) {
  return (
    <section
      className={cn(
        'divide-border border-border bg-background divide-y overflow-hidden rounded-md border',
        className,
      )}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Cargando mi resumen del periodo…</span>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-2.5 w-40" />
          <Skeleton className="h-5 w-20 rounded-4xl" />
        </div>

        <Skeleton className="h-8 w-44" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-full" />

          <div className="min-w-0 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-7 w-56 sm:h-8 sm:w-72" />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-2.5 w-44" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>
    </section>
  )
}
