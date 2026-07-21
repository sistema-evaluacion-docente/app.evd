import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { ProfessorCommentsTableSkeleton } from './ProfessorCommentsTableSkeleton'

const ROW_GRID = 'grid-cols-[minmax(150px,250px)_1fr_64px_20px]'

export function ProfessorSummarySkeleton() {
  return (
    <>
      <Card className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-12">
        <div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-3 h-12 w-28" />
          <Skeleton className="mt-3 h-7 w-24 rounded-full" />
        </div>

        <div className="bg-border hidden w-px self-stretch lg:block" />

        <div className="flex items-center gap-3.5">
          <Skeleton className="size-11 shrink-0" />

          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3.5 w-52 max-w-full" />
          </div>
        </div>

        <div className="lg:ml-auto lg:text-right">
          <Skeleton className="h-3 w-40 lg:ml-auto" />
          <Skeleton className="mt-2.5 h-7 w-20 lg:ml-auto" />
        </div>
      </Card>

      <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
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
      </Card>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
          </div>

          <Skeleton className="h-9 w-full sm:w-56" />
        </div>

        <Skeleton className="mt-5 h-60" />

        <div className="border-border mt-4 flex items-center gap-2 border-t pt-3.5">
          <Skeleton className="h-3.5 w-52" />
        </div>
      </Card>

      <ProfessorCommentsTableSkeleton />
    </>
  )
}
