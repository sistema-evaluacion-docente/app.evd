import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

/**
 * Contents of a `SelectTrigger` while its options are being fetched. A disabled
 * select only changes the cursor, which reads as a broken control; this says out
 * loud that something is on the way.
 *
 * Pair it with `selectLoadingTriggerClass` on the trigger so the label doesn't
 * come out dimmed by the `disabled:` styles of the primitive.
 *
 * @example
 * <SelectTrigger disabled={isLoading} className={cn('w-full', isLoading && selectLoadingTriggerClass)}>
 *   {isLoading ? <SelectLoadingLabel>Cargando docentes…</SelectLoadingLabel> : <SelectValue />}
 * </SelectTrigger>
 */
export function SelectLoadingLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('text-muted-foreground flex items-center gap-2', className)}>
      <Spinner className="size-4" aria-hidden="true" />
      {children}
    </span>
  )
}

/** Keeps the loading label legible instead of greyed out at 50% opacity. */
export const selectLoadingTriggerClass = 'disabled:cursor-progress disabled:opacity-100'
