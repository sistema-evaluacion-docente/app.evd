import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { ProfessorCommentsTableSkeleton } from './ProfessorCommentsTableSkeleton'

function StatTileSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-2.5 h-3 w-28" />
    </Card>
  )
}

export function ProfessorCategoryDetailSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="h-8 w-40" />

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Skeleton className="h-8 w-64 max-w-full" />
              <Skeleton className="h-7 w-32 rounded-full" />
            </div>

            <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {[0, 1, 2].map((pill) => (
              <Skeleton key={pill} className="h-8 w-36 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 pb-4 sm:p-7 sm:pb-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-2 h-3.5 w-96 max-w-full" />
        </div>

        <div className="border-border border-t">
          <div className="border-border bg-muted flex items-center gap-6 border-b px-6 py-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 max-w-90 flex-1" />
            <Skeleton className="h-2.5 w-40" />
            <Skeleton className="ml-auto h-2.5 w-16" />
          </div>

          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="border-border flex items-start gap-6 border-b px-6 py-4 last:border-b-0"
            >
              <Skeleton className="h-3.5 w-12" />

              <div className="max-w-90 min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>

              <div className="flex w-44 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-2.5 flex-1 rounded-full" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-2.5 flex-1 rounded-full" />
                </div>
              </div>
              <Skeleton className="ml-auto h-4 w-10" />
            </div>
          ))}
        </div>
      </Card>

      <ProfessorCommentsTableSkeleton />
    </>
  )
}
