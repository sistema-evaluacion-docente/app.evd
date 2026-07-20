import { Card } from '@/shared/ui'

import { ProfessorCommentsTableSkeleton } from './ProfessorCommentsTableSkeleton'

const ROW_GRID = 'grid-cols-[minmax(150px,250px)_1fr_64px_20px]'

export function ProfessorSummarySkeleton() {
  return (
    <>
      {/* ProfessorResultCard */}
      <Card className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-12">
        <div>
          <div className="h-3 w-40 animate-pulse rounded bg-ink-100" />
          <div className="mt-3 h-12 w-28 animate-pulse rounded bg-ink-100" />
          <div className="mt-3 h-7 w-24 animate-pulse rounded-full bg-ink-100" />
        </div>

        <div className="hidden w-px self-stretch bg-ink-100 lg:block" />

        <div className="flex items-center gap-3.5">
          <div className="size-11 shrink-0 animate-pulse rounded-md bg-ink-100" />
          <div>
            <div className="h-5 w-32 animate-pulse rounded bg-ink-100" />
            <div className="mt-2 h-3.5 w-52 max-w-full animate-pulse rounded bg-ink-100" />
          </div>
        </div>

        <div className="lg:ml-auto lg:text-right">
          <div className="h-3 w-40 animate-pulse rounded bg-ink-100 lg:ml-auto" />
          <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-ink-100 lg:ml-auto" />
        </div>
      </Card>

      {/* ProfessorCategoryChart */}
      <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
        <div className="h-5 w-52 animate-pulse rounded bg-ink-100" />
        <div className="mt-2 h-3.5 w-96 max-w-full animate-pulse rounded bg-ink-100" />

        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className={`grid ${ROW_GRID} items-center gap-4`}>
              <div className="h-3.5 w-full max-w-42.5 animate-pulse rounded bg-ink-100" />
              <div className="h-6 animate-pulse rounded-md bg-ink-100" />
              <div className="ml-auto h-4 w-8 animate-pulse rounded bg-ink-100" />
              <span />
            </div>
          ))}
        </div>

        {/* ProfessorHistoryChart */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-5 w-44 animate-pulse rounded bg-ink-100" />
            <div className="mt-2 h-3.5 w-80 max-w-full animate-pulse rounded bg-ink-100" />
          </div>
          <div className="h-9 w-full animate-pulse rounded-md bg-ink-100 sm:w-56" />
        </div>

        <div className="mt-5 h-60 animate-pulse rounded-md bg-ink-100" />

        <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-3.5">
          <div className="h-3.5 w-52 animate-pulse rounded bg-ink-100" />
        </div>
      </Card>

        <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-ink-100 pt-3.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-ink-100" />
          <div className="h-3.5 w-44 animate-pulse rounded bg-ink-100" />
        </div>
      </Card>

      <ProfessorCommentsTableSkeleton />
    </>
  )
}
