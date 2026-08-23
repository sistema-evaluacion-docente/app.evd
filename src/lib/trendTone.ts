/** Which way a metric moved against the point it is compared with. */
export type TrendDirection = 'up' | 'down' | 'flat'

/**
 * Green for growth, red for a drop, muted for no movement.
 *
 * One map because there were five: `ScoreBadge` and `ScoreProgress` used
 * `green-600`, the count charts used `emerald-600` with no dark variant at all,
 * and the same arrow ended up a different colour depending on which component
 * happened to draw it.
 *
 * Deliberately apart from `scoreTone`: this says *which way* a number moved,
 * not *how good* it is. A 2.1 that rose is still red as a score and green as a
 * trend, and collapsing the two would lose one of those readings.
 *
 * @example
 * <span className={TREND_TEXT_CLASS[direction]}>{delta}</span>
 */
export const TREND_TEXT_CLASS: Record<TrendDirection, string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-muted-foreground',
}
