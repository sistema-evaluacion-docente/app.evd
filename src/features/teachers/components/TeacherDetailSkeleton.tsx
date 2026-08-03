import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { ProfessorCommentsTableSkeleton } from './professor-summary/ProfessorCommentsTableSkeleton'

const ROW_GRID = 'grid-cols-[minmax(150px,250px)_1fr_64px_20px]'

export function TeacherDetailSkeleton() {
  return (
    <>
      <div className="mb-10 flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20" />

        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-56" />

          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6 sm:p-7">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-2 h-3.5 w-96 max-w-full" />

          <div className="mt-5 flex flex-col gap-3">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className={`grid ${ROW_GRID} items-center gap-4`}>
                <Skeleton className="h-3.5 w-full max-w-42.5" />
                <Skeleton className="h-6" />
                <Skeleton className="ml-auto h-4 w-8" />
                <span />
              </div>
            ))}
          </div>

          <div className="border-border mt-4 flex flex-wrap items-center gap-5 border-t pt-3.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-44" />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-4" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>

      <ProfessorCommentsTableSkeleton />
    </>
  )
}
