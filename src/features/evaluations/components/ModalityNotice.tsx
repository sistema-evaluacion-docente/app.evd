import { Filter } from 'lucide-react'

import { MODALITY_LABEL, type CourseModality } from '@/lib/modality'
import { cn } from '@/lib/utils'

export interface ModalityNoticeProps {
  /** Modality narrowing the page, or `undefined` when none is. */
  modality?: CourseModality
  className?: string
}

/**
 * States which modality the page is showing. Rendered in both states on
 * purpose: appearing only while filtering would leave "all modalities" implicit,
 * and that is the reading a director is most likely to get wrong. Announced
 * politely, since picking a modality replaces the page's numbers without moving
 * focus.
 *
 * @example
 * <ModalityNotice modality={modality} />
 */
export function ModalityNotice({ modality, className }: ModalityNoticeProps) {
  return (
    <p
      aria-live="polite"
      className={cn('text-muted-foreground flex items-center gap-2 text-sm', className)}
    >
      <Filter aria-hidden="true" className="size-3.5 shrink-0" />

      {modality
        ? `Mostrando solo los resultados de la modalidad ${MODALITY_LABEL[modality].toLowerCase()}.`
        : 'Mostrando los resultados de todas las modalidades.'}
    </p>
  )
}
