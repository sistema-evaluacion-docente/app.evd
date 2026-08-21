import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Line widths of the fake indicator rows, to avoid identical bars. */
const INDICATOR_LINES = ['w-72', 'w-56', 'w-64']

/**
 * Loading placeholder of the indicator matrix: dimension blocks with their
 * question rows, drawn while the scores and the student comments of the teacher
 * are still on their way.
 *
 * It is what the picker shows instead of its verdict — a matrix that hasn't
 * loaded yet looks exactly like a teacher with nothing below the threshold.
 *
 * @example
 * {isLoading ? <IndicatorMatrixSkeleton /> : <DimensionBlocks … />}
 */
export function IndicatorMatrixSkeleton({
  blocks = 2,
  className,
}: {
  /** How many dimension blocks to draw. */
  blocks?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: blocks }, (_, index) => (
        <div key={index} className="border-border bg-background rounded-md border">
          <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-12" />
          </div>

          <div className="divide-border divide-y">
            {INDICATOR_LINES.map((width, line) => (
              <div key={line} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className={cn('h-3.5 max-w-full', width)} />
                <Skeleton className="ml-auto h-6 w-12 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default IndicatorMatrixSkeleton
