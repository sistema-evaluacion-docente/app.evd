import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function ProfessorCommentsTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:p-7 sm:pb-4">
        <div>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
        </div>

        <Skeleton className="h-3.5 w-28 shrink-0" />
      </div>

      <div className="flex flex-col gap-3 px-6 pb-5 sm:px-7 lg:flex-row lg:items-center">
        <Skeleton className="h-9 min-w-0 flex-1" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:shrink-0">
          <Skeleton className="h-9 lg:w-52" />
          <Skeleton className="h-9 lg:w-52" />
          <Skeleton className="h-9 lg:w-44" />
        </div>
      </div>

      <div className="border-border border-t">
        <div className="border-border bg-muted flex items-center gap-6 border-b px-6 py-3">
          <Skeleton className="h-2.5 max-w-105 flex-1" />
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2.5 w-24" />
        </div>

        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="border-border flex items-start gap-6 border-b px-6 py-4 last:border-b-0"
          >
            <div className="max-w-105 min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>

            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-24 rounded-full" />

            <div className="flex w-24 flex-col items-start gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
