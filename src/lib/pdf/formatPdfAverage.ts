/**
 * Formats an average score for a PDF report, falling back to an em dash for
 * missing data — the backend's response types promise a plain `number` for
 * fields like `overall_average`, but in practice send `null` when there's no
 * evaluated data yet (a new department, an empty period). Calling
 * `.toFixed()` directly on one of those crashes the whole report (a real
 * incident: it took down `/home` for any director whose default period had
 * no data), so every report reads these through this instead of the raw
 * field.
 *
 * @example
 * formatPdfAverage(stats.overall_average) // '4.69' or '—'
 */
export function formatPdfAverage(value: number | null | undefined, decimals = 2): string {
  return value != null ? value.toFixed(decimals) : '—'
}
