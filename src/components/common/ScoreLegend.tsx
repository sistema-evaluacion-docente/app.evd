import { DEFAULT_DANGER_MAX, DEFAULT_SUCCESS_MIN } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'

export interface ScoreLegendProps {
  className?: string
}

/**
 * Explains, in plain words and always visibly (no hover/tooltip needed), the
 * red/amber/green semaphore used to color scores throughout the app — reads
 * the real thresholds from `scoreTone.ts` so it can never drift out of sync
 * with the color a reader actually sees. Spelled out ("Menor a 3.0" instead
 * of "< 3") so it reads clearly on its own, without assuming familiarity with
 * range notation.
 *
 * @example
 * <ScoreLegend />
 */
export function ScoreLegend({ className }: ScoreLegendProps) {
  const dangerMax = DEFAULT_DANGER_MAX.toFixed(1)
  const successMin = DEFAULT_SUCCESS_MIN.toFixed(1)

  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs',
        className,
      )}
    >
      <span className="font-medium">Escala de notas:</span>

      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-red-500" />
        {`Menor a ${dangerMax}`}
      </span>

      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-amber-500" />
        {`De ${dangerMax} a ${successMin}`}
      </span>

      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-green-500" />
        {`Mayor a ${successMin}`}
      </span>
    </div>
  )
}
