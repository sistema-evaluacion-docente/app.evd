/** Semantic tone bucket for a 0–5 evaluation score. */
export type ScoreTone = 'success' | 'warning' | 'danger'

/** Below this value the tone is `danger` — single source of truth, also used by `ScoreLegend`. */
export const DEFAULT_DANGER_MAX = 3
/** Above this value the tone is `success` — single source of truth, also used by `ScoreLegend`. */
export const DEFAULT_SUCCESS_MIN = 3.6

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
  { successMin = DEFAULT_SUCCESS_MIN, dangerMax = DEFAULT_DANGER_MAX }: ScoreToneOptions = {},
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
