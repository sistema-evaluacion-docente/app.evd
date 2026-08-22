import { fieldErrorId } from '@/lib/fieldErrorId'

interface FieldErrorProps {
  /** Id of the control this describes; the message is filed under `<id>-error`. */
  fieldId: string
  /** What is missing. Renders nothing when absent — the field is fine. */
  message?: string
}

/**
 * The one-line reason a field is red, said in words right under it.
 *
 * `aria-invalid` alone only announces "inválido", and a red ring alone says
 * nothing at all to someone who can't tell it from the border next to it. The
 * message is what makes the error perceivable either way, so it goes into the
 * accessibility tree (`role="alert"`) and onto the screen at the same time.
 *
 * Pair it with `fieldErrorId` on the control:
 *
 * @example
 * <Input id="title" aria-invalid={invalid} aria-describedby={invalid ? fieldErrorId('title') : undefined} />
 * <FieldError fieldId="title" message={errors.get('title')} />
 */
export function FieldError({ fieldId, message }: FieldErrorProps) {
  if (!message) return null

  return (
    <p id={fieldErrorId(fieldId)} role="alert" className="text-destructive text-xs">
      {message}
    </p>
  )
}
