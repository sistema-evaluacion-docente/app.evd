import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface ChartColumnSkeletonProps {
  /** The shape the column will end up holding, so it reserves the right box. */
  variant: 'bar' | 'pie'
  /** Width of the fake heading, matched to the real one's length. */
  headingWidth: string
  /** Legend rows drawn under a donut. The bar variant draws no legend. */
  legendWidths?: string[]
  className?: string
}

/**
 * One column of a comment-breakdown card while it loads: heading plus the box
 * the chart will occupy, laid out like the chart that replaces it so the card
 * doesn't resize when the data lands.
 *
 * The two variants are the two charts these cards draw: `bar` reserves the same
 * `h-64` block `DimensionComparisonChart` uses for its own loading state, and
 * `pie` draws the donut and its legend rows, which sit higher.
 *
 * @example
 * <ChartColumnSkeleton variant="pie" headingWidth="w-24" legendWidths={['w-32', 'w-36']} />
 */
export default function ChartColumnSkeleton({
  variant,
  headingWidth,
  legendWidths = [],
  className,
}: ChartColumnSkeletonProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      <Skeleton className={cn('mb-3 h-3', headingWidth)} />

      {variant === 'bar' ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : (
        <>
          <div className="flex h-56 items-center justify-center">
            <div className="relative">
              <Skeleton className="size-40 rounded-full" />

              <div aria-hidden="true" className="bg-background absolute inset-8 rounded-full" />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            {legendWidths.map((width, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <Skeleton className="size-2.5 shrink-0 rounded-full" />
                <Skeleton className={cn('h-3', width)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
