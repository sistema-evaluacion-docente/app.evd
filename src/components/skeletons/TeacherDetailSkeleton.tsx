import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Bar heights of the fake chart, so it reads as data instead of a grey block. */
const CHART_BARS = [
  [62, 78, 45, 90],
  [80, 52, 70, 38],
  [48, 66, 84, 58],
]

/** Segment widths of the fake risk-distribution bar in the comments header. */
const RISK_SEGMENTS = ['w-1/2', 'w-1/4', 'w-1/6']

/** Line widths of the fake comment bodies, to avoid three identical blocks. */
const COMMENT_LINES = [
  ['w-11/12', 'w-8/12'],
  ['w-full', 'w-5/12'],
  ['w-10/12', 'w-7/12'],
]

/**
 * Loading placeholder for the teacher detail page. Mirrors the real layout
 * section by section — hero, dimensions chart, course results and comments —
 * so nothing shifts when the data lands, and reveals the sections in a
 * staggered wave instead of flashing four grey blocks at once.
 *
 * @example
 * if (isLoading) return <TeacherDetailSkeleton />
 */
function TeacherDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando el detalle del docente…</span>

      <Skeleton className="h-8 w-28" />

      <Section delay={0}>
        <div className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
          <div className="flex flex-wrap items-start justify-between gap-6 p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-7 w-56" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-11 w-24" />
            </div>
          </div>

          <div className="divide-border grid grid-cols-2 divide-x sm:grid-cols-4">
            {CHART_BARS[0].map((_, index) => (
              <div key={index} className="space-y-2 px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="size-1.5 rounded-full" />
                  <Skeleton className="h-2.5 w-20" />
                </div>

                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section delay={80}>
        <Panel headerWidth="w-48">
          <div className="flex h-44 items-end gap-6 px-2">
            {CHART_BARS.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-36 w-full items-end justify-center gap-1.5">
                  {group.map((height, barIndex) => (
                    <Skeleton
                      key={barIndex}
                      className="w-full max-w-6 rounded-t-sm rounded-b-none"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <Skeleton className="h-2.5 w-20" />
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section delay={160}>
        <Panel headerWidth="w-56" bodyClassName="px-0 py-0">
          <div className="divide-border divide-y">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-4 shrink-0 rounded-sm" />

                  <div className="space-y-1.5">
                    <Skeleton className={cn('h-3.5', index % 2 ? 'w-52' : 'w-64')} />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>

                <Skeleton className="h-6 w-12 shrink-0" />
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section delay={240}>
        <div className="border-border bg-background overflow-hidden rounded-md border">
          <div className="border-border flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b px-6 py-5">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-44" />
              <Skeleton className="h-7 w-16" />
            </div>

            <div className="min-w-56 flex-1 space-y-2.5 sm:max-w-xs">
              <div className="flex h-1.5 gap-0.5">
                {RISK_SEGMENTS.map((width, index) => (
                  <Skeleton key={index} className={cn('h-full rounded-full', width)} />
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {RISK_SEGMENTS.map((_, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <Skeleton className="size-1.5 rounded-full" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-border bg-muted/20 space-y-3 border-b px-6 py-3">
            <Skeleton className="h-3.5 w-64" />

            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          <div className="px-6">
            <div className="flex items-center gap-2.5 py-4">
              <Skeleton className="size-3.5 shrink-0 rounded-sm" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="ml-auto h-3.5 w-6" />
            </div>

            <div className="divide-border/70 border-border/60 ml-1.5 divide-y border-l pl-5">
              {COMMENT_LINES.map(([first, second], index) => (
                <div key={index} className="grid grid-cols-[1.5rem_1fr] gap-x-4 py-5">
                  <Skeleton className="mx-auto size-1.5 rounded-full" />

                  <div className="space-y-2">
                    <Skeleton className={cn('h-3.5', first)} />
                    <Skeleton className={cn('h-3.5', second)} />

                    <div className="flex items-center gap-2.5 pt-1.5">
                      <Skeleton className="h-2.5 w-24" />
                      <Skeleton className="h-2.5 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

/** Reveals each block with a small delay, so the page loads as a wave. */
function Section({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** Bordered section with a hairline header, matching the real panels. */
function Panel({
  headerWidth,
  bodyClassName = 'px-6 py-4',
  children,
}: {
  headerWidth: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-background rounded-md border">
      <div className="border-border border-b px-6 py-4">
        <Skeleton className={cn('h-3.5', headerWidth)} />
      </div>

      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export default TeacherDetailSkeleton
