/** One entry being compared: the item itself, plus its computed delta. */
export interface MoverEntry<T> {
  item: T
  delta: number
}

/**
 * Finds the entry with the largest positive delta and the one with the
 * largest negative delta from a list of `{ item, delta }` pairs — the same
 * "mayor mejora / requiere atención" comparison already used for dimensions
 * and materias elsewhere in the app, generalized so new call sites don't
 * duplicate the reduce.
 *
 * @example
 * const { best, worst } = findBestWorstMover(
 *   courses.map((course) => ({ item: course, delta: course.average - course.previousAverage })),
 * );
 */
export function findBestWorstMover<T>(entries: MoverEntry<T>[]): {
  best: MoverEntry<T> | null
  worst: MoverEntry<T> | null
} {
  const best = entries.reduce<MoverEntry<T> | null>(
    (top, current) => (top == null || current.delta > top.delta ? current : top),
    null,
  )
  const worst = entries.reduce<MoverEntry<T> | null>(
    (bottom, current) => (bottom == null || current.delta < bottom.delta ? current : bottom),
    null,
  )
  return { best, worst }
}
