/** Semantic tone bucket for a 0–5 evaluation score. */
export type ScoreTone = 'success' | 'warning' | 'danger'

const TONE_TEXT_CLASS: Record<ScoreTone, string> = {
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
}

const TONE_BG_CLASS: Record<ScoreTone, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

interface ScoreToneOptions {
  /** Above this value the tone is `success`. Defaults to 3.6. */
  successMin?: number
  /** Below this value the tone is `danger`. Defaults to 3. */
  dangerMax?: number
}

/**
 * Buckets a score into a semantic tone: `danger` below `dangerMax`,
 * `success` above `successMin`, `warning` in between. Shared by `ScoreBadge`
 * and any other place that needs to color a score consistently.
 *
 * @example
 * getScoreTone(4.2) // "success"
 */
export function getScoreTone(
  value: number,
  { successMin = 3.6, dangerMax = 3 }: ScoreToneOptions = {},
): ScoreTone {
  if (value > successMin) return 'success'
  if (value < dangerMax) return 'danger'
  return 'warning'
}

/**
 * Resolves a score directly to its Tailwind text color class.
 *
 * @example
 * <span className={getScoreToneClass(2.8)}>2.8</span>
 */
export function getScoreToneClass(value: number, options?: ScoreToneOptions) {
  return TONE_TEXT_CLASS[getScoreTone(value, options)]
}

/**
 * Resolves a score directly to its Tailwind background color class — the
 * `bg-*` counterpart of `getScoreToneClass`, for dots, bars, and swatches.
 *
 * @example
 * <span className={getScoreToneBgClass(2.8)} />
 */
export function getScoreToneBgClass(value: number, options?: ScoreToneOptions) {
  return TONE_BG_CLASS[getScoreTone(value, options)]
}
