/**
 * Fixed 7-color categorical palette for identifying teachers across the
 * comparison page (ranking, dimension cards, indicators table). Validated
 * with the dataviz skill's palette validator against this app's actual
 * background (`#ffffff`): worst adjacent CVD separation ΔE 9.1, clear of the
 * ≥8 target — valid as long as every bar/row also carries the teacher's name
 * (never color-only identity). The 8th hue of the documented default
 * (red, `#e34948`) is dropped here — it collides with this app's brand red,
 * already used everywhere else on this screen (buttons, hover, badges).
 */
const TEACHER_COMPARISON_PALETTE = [
  '#2a78d6', // azul
  '#eb6834', // naranja
  '#1baf7a', // aqua
  '#eda100', // amarillo
  '#e87ba4', // magenta
  '#008300', // verde
  '#4a3aa7', // violeta
] as const

/** Neutral fallback color for any (teacher, group) pair past the 7-color palette. */
const OVERFLOW_COLOR = 'var(--color-muted-foreground)'

export interface TeacherComparisonColorEntry {
  teacher_id: number
  group_name: string
}

/**
 * Stable identity key for one (teacher, group) pair — a teacher who taught
 * two groups of the same subject gets two distinct keys/colors.
 *
 * @example
 * comparisonEntryKey({ teacher_id: 12, group_name: 'A' }) // '12-A'
 */
export function comparisonEntryKey(entry: TeacherComparisonColorEntry): string {
  return `${entry.teacher_id}-${entry.group_name}`
}

/**
 * Assigns each (teacher, group) pair a color from the fixed palette, ordered
 * by `teacher_id` then `group_name` — never by score or array position — so
 * a teacher keeps the same color everywhere on the page regardless of the
 * API's response order or how any one chart sorts its own rows (e.g. the
 * ranking, sorted by average). Entries past the 7th fall back to a neutral
 * color instead of inventing a new hue.
 *
 * @example
 * const colorByKey = buildTeacherComparisonColorMap(entries)
 * colorByKey.get(comparisonEntryKey(entry))
 */
export function buildTeacherComparisonColorMap<T extends TeacherComparisonColorEntry>(
  entries: T[],
): Map<string, string> {
  const sorted = [...entries].sort(
    (a, b) => a.teacher_id - b.teacher_id || a.group_name.localeCompare(b.group_name),
  )

  const colorByKey = new Map<string, string>()

  sorted.forEach((entry, index) => {
    colorByKey.set(comparisonEntryKey(entry), TEACHER_COMPARISON_PALETTE[index] ?? OVERFLOW_COLOR)
  })

  return colorByKey
}
