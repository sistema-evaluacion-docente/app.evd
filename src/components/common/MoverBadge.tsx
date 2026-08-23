import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { SCORE_TONE_BADGE_CLASS } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'

/** Which end of the comparison this badge is reporting. */
export type MoverDirection = 'up' | 'down'

const TONE_CLASS: Record<MoverDirection, string> = {
  up: SCORE_TONE_BADGE_CLASS.success,
  down: SCORE_TONE_BADGE_CLASS.danger,
}

const ICON: Record<MoverDirection, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
}

/** `sm` sits inline under a chart; `md` stands on its own in a hero row. */
const SIZE_CLASS = {
  sm: 'gap-1',
  md: 'h-auto gap-2 rounded-full px-3.5 py-2 text-sm',
} as const

const ICON_CLASS = { sm: 'size-3.5', md: 'size-4.5' } as const

export interface MoverBadgeProps {
  direction: MoverDirection
  /** Defaults to `sm`. */
  size?: keyof typeof SIZE_CLASS
  children: ReactNode
  className?: string
}

/**
 * "Mayor mejora" / "Requiere atención", the pair of chips that name the two
 * ends of a period-over-period comparison.
 *
 * The logic behind them has been shared in `bestWorstMover.ts` for a while;
 * the styling had not, so the same chip was copy-pasted into four screens in
 * two shapes — and none of the four had a dark-mode variant, which left green
 * text on a near-white pill floating over a dark page.
 *
 * @example
 * <MoverBadge direction="up">Mayor mejora: {name} (+{delta.toFixed(2)})</MoverBadge>
 * <MoverBadge direction="down" size="md">Requiere atención: {name} ({delta.toFixed(2)})</MoverBadge>
 */
export function MoverBadge({ direction, size = 'sm', children, className }: MoverBadgeProps) {
  const Icon = ICON[direction]

  return (
    <Badge className={cn(TONE_CLASS[direction], SIZE_CLASS[size], className)}>
      <Icon className={ICON_CLASS[size]} aria-hidden="true" />
      {children}
    </Badge>
  )
}
