/**
 * Normalizes a score that may arrive either as a 0–1 ratio or as a 0–100
 * value into a whole percentage, clamped to 0–100. Returns `null` when there
 * is nothing to show, so callers can skip rendering instead of printing `0%`.
 *
 * @example
 * toPercent(0.82) // 82
 * toPercent(82)   // 82
 * toPercent(undefined) // null
 */
export function toPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return null

  const percent = value > 1 ? value : value * 100

  return Math.min(100, Math.max(0, Math.round(percent)))
}

/**
 * Formats a 0–1 or 0–100 score as a percentage string, with an em dash when
 * the value is missing.
 *
 * @example
 * formatPercent(0.82) // "82%"
 */
export function formatPercent(value?: number | null) {
  const percent = toPercent(value)

  return percent == null ? '—' : `${percent}%`
}
