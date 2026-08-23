import { dimensionColor } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'

export interface DimensionDotProps {
  /**
   * Full name of the evaluation dimension — the same string the pedagogical
   * category of a comment maps to. `null` paints the muted dot of everything
   * that belongs to no dimension.
   */
  dimension?: string | null
  className?: string
}

/**
 * Colour dot of an evaluation dimension, taken from the same palette the
 * charts and the category tags use, so a heading reads in the colour of the
 * dimension it groups.
 *
 * Decorative on purpose: it always sits next to the name it colours, so a
 * screen reader would only hear it twice.
 *
 * @example
 * <DimensionDot dimension="Desempeño Docente" />
 */
export function DimensionDot({ dimension, className }: DimensionDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-2 shrink-0 rounded-full',
        !dimension && 'bg-muted-foreground/40',
        className,
      )}
      style={dimension ? { backgroundColor: dimensionColor(dimension) } : undefined}
    />
  )
}
