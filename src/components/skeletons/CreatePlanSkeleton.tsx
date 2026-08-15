import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** The five aspects of the official forms, drawn as empty commitment cards. */
const ASPECTS = [0, 1, 2, 3, 4]

/** Line widths of the fake indicator rows, to avoid five identical bars. */
const INDICATOR_LINES = ['w-72', 'w-56', 'w-64', 'w-80', 'w-52']

/**
 * Loading placeholder for the plan creation page. It draws the five sections of
 * the real form — teacher and period, indicators, commitments, subjects and plan
 * data — with the five aspect cards already in place, so the page appears whole
 * instead of assembling itself request by request in front of the director.
 *
 * `withTeacher` mirrors the sections that only exist once a teacher is chosen,
 * for when the teacher profile links here with one preselected.
 *
 * @example
 * if (shellLoading) return <CreatePlanSkeleton withTeacher={presetTeacher != null} />
 */
function CreatePlanSkeleton({ withTeacher = false }: { withTeacher?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando el formulario del plan de mejoramiento…</span>

      <header className="mb-6 space-y-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-80 max-w-full" />
      </header>

      <Panel headingWidth="w-48">
        <div className="flex flex-wrap gap-4">
          <Field labelWidth="w-32" className="w-40" />
          <Field labelWidth="w-16" className="w-full" wrapperClassName="min-w-64 flex-1" />
        </div>

        {withTeacher && (
          <div className="border-border flex flex-wrap items-center gap-3 rounded-md border p-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />

            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-24" />
            </div>

            <Skeleton className="h-7 w-16 shrink-0" />
          </div>
        )}
      </Panel>

      {withTeacher && (
        <Panel headingWidth="w-64" descriptionWidths={['w-full', 'w-3/4']}>
          <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <Skeleton className="h-3.5 w-56" />

            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-44" />
            </div>
          </div>

          {[0, 1].map((index) => (
            <div key={index} className="border-border rounded-md border">
              <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-12" />
              </div>

              <div className="divide-border divide-y">
                {INDICATOR_LINES.slice(0, 3).map((width, line) => (
                  <div key={line} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="size-4 shrink-0 rounded-sm" />
                    <Skeleton className={cn('h-3.5', width)} />
                    <Skeleton className="ml-auto h-6 w-12 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Panel headingWidth="w-36" descriptionWidths={['w-full', 'w-2/3']}>
        {ASPECTS.map((aspect) => (
          <div key={aspect} className="border-border rounded-md border">
            <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
              <Skeleton className={cn('h-3.5', INDICATOR_LINES[aspect])} />
              <Skeleton className="h-3.5 w-32 shrink-0" />
            </div>

            <div className="px-4 py-3">
              <Skeleton className="h-3.5 w-52" />
            </div>
          </div>
        ))}

        <div className="space-y-4 border-t pt-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-72" />
            <Skeleton className="h-[4.5rem] w-full" />
          </div>

          <div className="flex flex-wrap gap-4">
            {[0, 1].map((index) => (
              <div key={index} className="min-w-64 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-64 max-w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {withTeacher && (
        <Panel headingWidth="w-40" descriptionWidths={['w-full', 'w-1/2']}>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-8 w-40" />
        </Panel>
      )}

      <Panel headingWidth="w-40">
        <Field labelWidth="w-12" className="w-full" />

        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-[4.5rem] w-full" />
        </div>

        <div className="flex flex-wrap gap-4">
          {['w-16', 'w-48', 'w-40'].map((labelWidth) => (
            <Field
              key={labelWidth}
              labelWidth={labelWidth}
              className="w-full"
              wrapperClassName="min-w-56 flex-1"
            />
          ))}
        </div>

        <Field labelWidth="w-28" className="w-full" wrapperClassName="max-w-64" />
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-3 pb-8">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}

/** Bordered section with a heading and, optionally, its explanatory paragraph. */
function Panel({
  headingWidth,
  descriptionWidths,
  children,
}: {
  headingWidth: string
  descriptionWidths?: string[]
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-background space-y-4 rounded-md border p-6">
      <div className="space-y-2">
        <Skeleton className={cn('h-5', headingWidth)} />

        {descriptionWidths?.map((width) => (
          <Skeleton key={width} className={cn('h-3.5 max-w-full', width)} />
        ))}
      </div>

      {children}
    </section>
  )
}

/** Label above a control, matching the `space-y-1.5` groups of the real form. */
function Field({
  labelWidth,
  className,
  wrapperClassName,
}: {
  labelWidth: string
  className: string
  wrapperClassName?: string
}) {
  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      <Skeleton className={cn('h-3.5', labelWidth)} />
      <Skeleton className={cn('h-9', className)} />
    </div>
  )
}

export default CreatePlanSkeleton
