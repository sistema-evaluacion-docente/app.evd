import { Card } from '@/shared/ui'

/** Loading placeholder mirroring {@link ProfessorCommentsTable}. */
export function ProfessorCommentsTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:p-7 sm:pb-4">
        <div>
          <div className="h-5 w-56 animate-pulse rounded bg-ink-100" />
          <div className="mt-2 h-3.5 w-80 max-w-full animate-pulse rounded bg-ink-100" />
        </div>
        <div className="h-3.5 w-28 shrink-0 animate-pulse rounded bg-ink-100" />
      </div>

      <div className="flex flex-col gap-3 px-6 pb-5 sm:px-7 lg:flex-row lg:items-center">
        <div className="h-9 min-w-0 flex-1 animate-pulse rounded-md bg-ink-100" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:shrink-0">
          <div className="h-9 animate-pulse rounded-md bg-ink-100 lg:w-52" />
          <div className="h-9 animate-pulse rounded-md bg-ink-100 lg:w-52" />
          <div className="h-9 animate-pulse rounded-md bg-ink-100 lg:w-44" />
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="flex items-center gap-6 border-b border-ink-200 bg-ink-50/60 px-6 py-3">
          <div className="h-2.5 flex-1 max-w-[420px] animate-pulse rounded bg-ink-200" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-ink-200" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-ink-200" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-ink-200" />
        </div>
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex items-start gap-6 border-b border-ink-100 px-6 py-4 last:border-b-0"
          >
            <div className="min-w-0 flex-1 max-w-[420px] space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-ink-100" />
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-ink-100" />
            </div>
            <div className="h-3.5 w-24 animate-pulse rounded bg-ink-100" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-ink-100" />
            <div className="flex w-24 flex-col items-start gap-1.5">
              <div className="h-6 w-16 animate-pulse rounded-full bg-ink-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
