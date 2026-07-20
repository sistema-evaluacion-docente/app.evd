import { Card } from '@/shared/ui'

import { ProfessorCommentsTableSkeleton } from './ProfessorCommentsTableSkeleton'

function StatTileSkeleton() {
  return (
    <Card className="p-5">
      <div className="h-2.5 w-24 animate-pulse rounded bg-ink-100" />
      <div className="mt-3 h-7 w-16 animate-pulse rounded bg-ink-100" />
      <div className="mt-2.5 h-3 w-28 animate-pulse rounded bg-ink-100" />
    </Card>
  )
}

export function ProfessorCategoryDetailSkeleton() {
  return (
    <>
      <div>
        <div className="h-8 w-40 animate-pulse rounded-md bg-ink-100" />

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="h-8 w-64 max-w-full animate-pulse rounded bg-ink-100" />
              <div className="h-6.5 w-32 animate-pulse rounded-full bg-ink-100" />
            </div>
            <div className="mt-2 h-3.5 w-80 max-w-full animate-pulse rounded bg-ink-100" />
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {[0, 1, 2].map((pill) => (
              <div
                key={pill}
                className="h-8 w-36 animate-pulse rounded-full bg-ink-100"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      {/* Desglose de preguntas */}
      <Card className="overflow-hidden">
        <div className="p-6 pb-4 sm:p-7 sm:pb-4">
          <div className="h-5 w-56 animate-pulse rounded bg-ink-100" />
          <div className="mt-2 h-3.5 w-96 max-w-full animate-pulse rounded bg-ink-100" />
        </div>

        <div className="border-t border-ink-100">
          <div className="flex items-center gap-6 border-b border-ink-200 bg-ink-50/60 px-6 py-3">
            <div className="h-2.5 w-16 animate-pulse rounded bg-ink-200" />
            <div className="h-2.5 flex-1 max-w-90 animate-pulse rounded bg-ink-200" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-ink-200" />
            <div className="ml-auto h-2.5 w-16 animate-pulse rounded bg-ink-200" />
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex items-start gap-6 border-b border-ink-100 px-6 py-4 last:border-b-0"
            >
              <div className="h-3.5 w-12 animate-pulse rounded bg-ink-100" />
              <div className="min-w-0 flex-1 max-w-90 space-y-2">
                <div className="h-3.5 w-full animate-pulse rounded bg-ink-100" />
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-ink-100" />
              </div>
              <div className="flex w-44 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-12 animate-pulse rounded bg-ink-100" />
                  <div className="h-2.5 flex-1 animate-pulse rounded-full bg-ink-100" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-12 animate-pulse rounded bg-ink-100" />
                  <div className="h-2.5 flex-1 animate-pulse rounded-full bg-ink-100" />
                </div>
              </div>
              <div className="ml-auto h-4 w-10 animate-pulse rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </Card>

      <ProfessorCommentsTableSkeleton />
    </>
  )
}
