/** Below this magnitude a change reads as noise, not a real trend. */
const DELTA_NOISE_THRESHOLD = 0.5

export interface CountDelta {
  /** Share of `value` within its own total, 0–100. */
  percent: number
  /** Share of `previousValue` within the previous total, 0–100 — only set when every entry carried a `previousValue`. */
  previousPercent?: number
  /** `percent - previousPercent`, in percentage points. */
  deltaPoints?: number
}

/**
 * Turns a set of counts (and their optional counterpart from a comparison
 * period) into percentages and a percentage-point delta per entry. The delta
 * is computed on shares of the total, never on raw counts, because the total
 * number of items (e.g. comments) can differ between the two periods being
 * compared. Only returns deltas when *every* entry has a `previousValue` —
 * a partial comparison would be misleading.
 *
 * @example
 * computeCountDeltas([{ value: 5, previousValue: 2 }, { value: 5, previousValue: 8 }])
 */
export function computeCountDeltas<T extends { value: number; previousValue?: number }>(
  entries: T[],
): CountDelta[] {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)
  const hasAllPrevious = entries.length > 0 && entries.every((entry) => entry.previousValue != null)
  const previousTotal = hasAllPrevious
    ? entries.reduce((sum, entry) => sum + (entry.previousValue ?? 0), 0)
    : 0

  return entries.map((entry) => {
    const percent = total > 0 ? (entry.value / total) * 100 : 0

    if (!hasAllPrevious || previousTotal === 0) return { percent }

    const previousPercent = ((entry.previousValue ?? 0) / previousTotal) * 100

    return { percent, previousPercent, deltaPoints: percent - previousPercent }
  })
}

/** Whether a delta is large enough to show as a trend instead of noise. */
export function isRelevantDelta(deltaPoints?: number): deltaPoints is number {
  return deltaPoints != null && Math.abs(deltaPoints) >= DELTA_NOISE_THRESHOLD
}
