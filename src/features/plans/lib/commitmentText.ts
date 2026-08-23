/**
 * Merging a suggested wording into a commitment that is already being written.
 *
 * The department's default actions used to replace the field outright, so a
 * director who had typed something and then went looking for a second action
 * lost the first. They are a list of things the teacher commits to, and a
 * commitment can hold several — so they accumulate, separated by commas.
 */

/** Trailing punctuation a comma should not sit behind. */
const TRAILING_PUNCTUATION = /[,;.\s]+$/

/**
 * Adds a suggested action to what the commitment already says.
 *
 * Adding one that is already in there is a no-op: the list is collapsed by
 * default, so clicking the same wording twice is a slip, never an intention.
 *
 * @example
 * appendSuggestedAction('', 'Aplicar rúbricas')            // → "Aplicar rúbricas"
 * appendSuggestedAction('Aplicar rúbricas.', 'Socializar') // → "Aplicar rúbricas, Socializar"
 */
export function appendSuggestedAction(current: string, action: string): string {
  const addition = action.trim()

  if (!addition) return current

  const base = current.replace(TRAILING_PUNCTUATION, '')

  if (!base.trim()) return addition

  if (base.toLocaleLowerCase().includes(addition.toLocaleLowerCase())) return current

  return `${base}, ${addition}`
}
