import {
  categoryColor,
  categoryLabel,
  categoryShortLabel,
  isUncategorized,
} from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import type { CommentPedagogicalCategory } from '../types'

/** Visual treatment of a `CategoryTag`. */
export type CategoryTagVariant = 'text' | 'soft' | 'outline'

/** Size of a `CategoryTag`. */
export type CategoryTagSize = 'sm' | 'md'

export interface CategoryTagProps {
  /** Category object from the API; `name` is the raw `LABEL_n` code. */
  category?: Pick<CommentPedagogicalCategory, 'name' | 'color_hex' | 'description'> | null
  /** Raw code or name, when there is no full category object at hand. */
  name?: string | null
  /** `text` is a bare uppercase micro-label, `soft` a tinted pill, `outline` a bordered one. */
  variant?: CategoryTagVariant
  size?: CategoryTagSize
  /** Use the short label ("Evaluación" instead of "Procesos de evaluación"). */
  short?: boolean
  /** Leading color dot. Defaults to `true`. */
  showDot?: boolean
  /** Classification confidence (0–1); rendered as a percentage suffix. */
  score?: number
  className?: string
}

const SIZE_CLASS: Record<CategoryTagSize, string> = {
  sm: 'gap-1.5 text-xs',
  md: 'gap-2 text-sm',
}

const PADDING_CLASS: Record<CategoryTagSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
}

/**
 * Renders a pedagogical category (`LABEL_0`…`LABEL_4`) as a readable,
 * color-matched tag. The color comes from the evaluation dimension the
 * category belongs to, so it lines up with the charts and the hero stats;
 * uncategorized comments are deliberately muted.
 *
 * @example
 * <CategoryTag category={comment.pedagogical_category} />
 *
 * @example
 * <CategoryTag name="LABEL_2" variant="soft" short score={0.82} />
 */
export function CategoryTag({
  category,
  name,
  variant = 'text',
  size = 'sm',
  short = false,
  showDot = true,
  score,
  className,
}: CategoryTagProps) {
  const code = category?.name ?? name
  const label = short ? categoryShortLabel(code) : categoryLabel(code)
  const muted = isUncategorized(code)
  const color = muted ? undefined : categoryColor(code, category?.color_hex)

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center font-medium tracking-wide uppercase',
        SIZE_CLASS[size],
        variant !== 'text' && PADDING_CLASS[size],
        variant === 'soft' && 'rounded-full',
        variant === 'outline' && 'rounded-full border',
        muted && 'text-muted-foreground/70',
        variant === 'outline' && !color && 'border-border',
        className,
      )}
      style={
        color
          ? {
              color:
                variant === 'text'
                  ? `color-mix(in srgb, ${color} 80%, var(--color-muted-foreground))`
                  : color,
              backgroundColor:
                variant === 'soft' ? `color-mix(in srgb, ${color} 12%, transparent)` : undefined,
              borderColor:
                variant === 'outline' ? `color-mix(in srgb, ${color} 40%, transparent)` : undefined,
            }
          : undefined
      }
      title={category?.description || label}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn('size-1.5 shrink-0 rounded-full', muted && 'bg-muted-foreground/40')}
          style={color ? { backgroundColor: color } : undefined}
        />
      )}

      <span className="truncate">{label}</span>

      {score != null && (
        <span className="num shrink-0 tabular-nums opacity-60">
          {Math.round((score > 1 ? score / 100 : score) * 100)}%
        </span>
      )}
    </span>
  )
}
