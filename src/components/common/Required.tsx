/**
 * The red asterisk of a required field, said once instead of at every label.
 *
 * `aria-hidden` on purpose: a screen reader gets the obligation from the
 * control's own `required` / `aria-invalid`, not from a floating star.
 *
 * @example
 * <Label htmlFor="faculty">Facultad <Required /></Label>
 */
export function Required() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  )
}
