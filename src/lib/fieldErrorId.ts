/**
 * Id of the message describing the field `fieldId`.
 *
 * Both sides read it from here so the `aria-describedby` of the control and the
 * `id` of the message it points at can never drift apart.
 *
 * @example
 * fieldErrorId('acta-number') // → 'acta-number-error'
 */
export function fieldErrorId(fieldId: string): string {
  return `${fieldId}-error`
}
