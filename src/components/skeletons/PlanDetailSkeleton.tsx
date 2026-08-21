import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Line widths of the fake commitments, to avoid three identical grey blocks. */
const COMMITMENT_LINES = [
  ['w-10/12', 'w-7/12'],
  ['w-11/12', 'w-5/12'],
]

/** The two cuts of the semester, drawn where the seguimientos will land. */
const CHECKPOINTS = ['w-40', 'w-44']

/**
 * Loading placeholder for a plan's detail page. It draws the real layout —
 * header, commitments, seguimientos, evidencias and formatos — so the page
 * appears whole instead of assembling itself request by request: the plan, the
 * aspect catalogue and the evidence loop all arrive on their own schedule.
 *
 * `withAvatar` mirrors the director's header, which leads with the teacher it
 * belongs to; the teacher's own view leads with the title of the plan.
 *
 * @example
 * if (isPending) return <PlanDetailSkeleton withAvatar />
 */
function PlanDetailSkeleton({ withAvatar = false }: { withAvatar?: boolean }) {
  return (
    <div className="space-y-6 pb-8" role="status" aria-busy="true">
      <span className="sr-only">Cargando el plan de mejoramiento…</span>

      <Skeleton className="h-8 w-28" />

      <section className="border-border bg-background overflow-hidden rounded-md border">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex min-w-0 items-center gap-3">
            {withAvatar && <Skeleton className="size-12 shrink-0 rounded-full" />}

            <div className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-3.5 w-40" />
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
            </div>
          </div>

          <div className="min-w-48 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </div>

        <Skeleton className="mx-6 mb-4 h-3.5 w-56" />
      </section>

      <Panel headingWidth="w-36" subheadingWidth="w-72">
        {COMMITMENT_LINES.map((lines, index) => (
          <div key={index} className="space-y-2 px-6 py-4">
            <Skeleton className="h-3.5 w-48" />
            <div className="border-border space-y-2 rounded-md border p-3">
              {lines.map((width) => (
                <Skeleton key={width} className={cn('h-3.5', width)} />
              ))}
              <div className="flex gap-3 pt-0.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </Panel>

      <Panel headingWidth="w-32" subheadingWidth="w-80">
        {CHECKPOINTS.map((width) => (
          <div key={width} className="space-y-3 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1.5">
                <Skeleton className={cn('h-4', width)} />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3.5 w-9/12" />
          </div>
        ))}
      </Panel>

      <Panel headingWidth="w-28" subheadingWidth="w-64">
        <div className="space-y-3 px-6 py-4">
          <Skeleton className="h-4 w-64" />
          <div className="border-border flex items-center gap-3 rounded-md border px-3 py-2">
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </Panel>

      <Panel headingWidth="w-44" subheadingWidth="w-72">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-wrap items-center gap-4 px-6 py-4">
            <Skeleton className="size-5 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-56" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        ))}
      </Panel>
    </div>
  )
}

/** One bordered section with its heading, matching the real page's chrome. */
function Panel({
  headingWidth,
  subheadingWidth,
  children,
}: {
  headingWidth: string
  subheadingWidth: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="space-y-2 border-b px-6 py-4">
        <Skeleton className={cn('h-4', headingWidth)} />
        <Skeleton className={cn('h-3', subheadingWidth)} />
      </header>

      <div className="divide-border divide-y">{children}</div>
    </section>
  )
}

export default PlanDetailSkeleton
