import { memo, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { FieldError } from '@/components/common/FieldError'
import { DimensionDot } from '@/components/common/DimensionDot'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { commitmentFieldId, isMeasurable, itemsInPaintedOrder } from '../lib/planValidation'
import type { DraftItem, PlanAspect } from '../types'

interface CommitmentsEditorProps {
  items: DraftItem[]
  aspects: PlanAspect[]
  /** Reopens the commitment in `CommitmentDialog`, where it is written. */
  onEdit: (key: string) => void
  onRemove: (key: string) => void
  /**
   * The fields to paint red, each against what is missing from it. The page
   * decides when one enters the map; the message is what the card says out
   * loud once it is in there.
   */
  invalidFields: ReadonlyMap<string, string>
  disabled?: boolean
}

/**
 * The commitments of a plan, laid out as the sections of the official forms:
 * the four evaluation dimensions plus "Observaciones de los Estudiantes". Each
 * row keeps the indicator description and the commitment apart, because
 * Formato 2 prints them as two separate blocks.
 *
 * Reads rather than edits: the fields live in `CommitmentDialog`, which the
 * picker opens the moment an indicator is added. Editing them here as well
 * would mean two places to write the same commitment, and the scroll between
 * the matrix and these cards is exactly what the dialog exists to remove.
 *
 * Only the aspects the director actually picked something for are drawn. Empty
 * ones used to be listed with a "sin compromisos" line each, which filled the
 * page with sections nobody was going to touch.
 *
 * @example
 * <CommitmentsEditor items={items} aspects={aspects} onEdit={openDialog} onRemove={remove}
 *   invalidFields={invalid} />
 */
export function CommitmentsEditor({
  items,
  aspects,
  onEdit,
  onRemove,
  invalidFields,
  disabled = false,
}: CommitmentsEditorProps) {
  const filled = aspects.filter((aspect) => items.some((item) => item.aspect === aspect.aspect))
  const orphans = items.filter((item) => item.aspect == null)

  // The cards are numbered across the whole plan, not within their section: the
  // aspects are a way of laying the list out, not five separate lists, and
  // three cards all titled "Compromiso 1" leave nothing to point at out loud.
  const numbers = useMemo(
    () => new Map(itemsInPaintedOrder(items, aspects).map((item, index) => [item.key, index + 1])),
    [items, aspects],
  )

  const rowProps = (item: DraftItem) => ({
    item,
    number: numbers.get(item.key) ?? 0,
    onEdit,
    onRemove,
    descriptionError: invalidFields.get(commitmentFieldId.description(item.key)),
    commitmentError: invalidFields.get(commitmentFieldId.commitment(item.key)),
    targetError: invalidFields.get(commitmentFieldId.target(item.key)),
    aspectError: invalidFields.get(commitmentFieldId.aspect(item.key)),
    disabled,
  })

  return (
    <div className="space-y-4">
      {filled.map((aspect) => (
        <section key={aspect.aspect} className="border-border rounded-md border">
          <header className="bg-muted/40 border-b px-4 py-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <DimensionDot dimension={aspect.dimension} />
              <span>
                <span className="text-muted-foreground num mr-1.5">{aspect.aspect}.</span>
                {aspect.label}
              </span>
            </h3>
          </header>

          <ul className="space-y-3 p-3">
            {items
              .filter((item) => item.aspect === aspect.aspect)
              .map((item) => (
                <CommitmentRow key={item.key} {...rowProps(item)} />
              ))}
          </ul>
        </section>
      ))}

      {orphans.length > 0 && (
        <section className="border-border rounded-md border border-dashed">
          <header className="bg-muted/40 border-b px-4 py-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <DimensionDot />
              Sin aspecto asignado
            </h3>
            <p className="text-muted-foreground text-xs">
              Estos compromisos no se imprimirán en los formatos hasta que elijas un aspecto.
            </p>
          </header>

          <ul className="space-y-3 p-3">
            {orphans.map((item) => (
              <CommitmentRow key={item.key} {...rowProps(item)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/**
 * One commitment card.
 *
 * Memoised, and given its own errors as plain strings rather than the map of
 * every field in the form: the map is rebuilt whenever anything in the page
 * changes, so sharing it would redraw all the cards for an edit that belongs
 * to one of them.
 */
const CommitmentRow = memo(function CommitmentRow({
  item,
  number,
  onEdit,
  onRemove,
  descriptionError,
  commitmentError,
  targetError,
  aspectError,
  disabled,
}: {
  item: DraftItem
  /** Position in the plan as a whole: the card is titled "Compromiso N". */
  number: number
  onEdit: (key: string) => void
  onRemove: (key: string) => void
  /** What each field is missing, or `undefined` while it is fine. */
  descriptionError?: string
  commitmentError?: string
  targetError?: string
  aspectError?: string
  disabled: boolean
}) {
  const descriptionId = commitmentFieldId.description(item.key)
  const commitmentId = commitmentFieldId.commitment(item.key)
  const targetId = commitmentFieldId.target(item.key)
  const aspectId = commitmentFieldId.aspect(item.key)

  return (
    // The card is one closed grey block with white fields inside: stacked on a
    // white page they blurred into one another, and a director filling several
    // in a row could not tell where one ended and the next began.
    <li className="bg-muted border-border space-y-2 rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs">
            Compromiso <span className="num">{number}</span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* `tabIndex` so a refused save can put the cursor on the card
                even though nothing in it is a control any more; `outline-none`
                so it doesn't grow a focus ring for it. */}
            <p id={descriptionId} tabIndex={-1} className="text-sm font-semibold outline-none">
              {item.description.trim() || 'Compromiso sin título'}
            </p>

            {item.source_subject_label && (
              <Badge variant="outline" className="bg-background font-normal">
                {item.source_subject_label}
              </Badge>
            )}
          </div>

          <FieldError fieldId={descriptionId} message={descriptionError} />

          <span id={aspectId} tabIndex={-1} className="sr-only outline-none">
            Aspecto del formato
          </span>
          <FieldError fieldId={aspectId} message={aspectError} />
        </div>

        {!disabled && (
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" size="sm" variant="outline" onClick={() => onEdit(item.key)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Editar
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onRemove(item.key)}
              aria-label={`Quitar compromiso ${number}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div>
        <p id={commitmentId} tabIndex={-1} className="text-sm whitespace-pre-line outline-none">
          {item.commitment.trim() || (
            <span className="text-muted-foreground italic">Sin compromiso escrito todavía</span>
          )}
        </p>

        <FieldError fieldId={commitmentId} message={commitmentError} />
      </div>

      {(isMeasurable(item) || item.baseline_value != null) && (
        <div>
          <p className="text-muted-foreground text-xs">
            {isMeasurable(item) && (
              <span id={targetId} tabIndex={-1} className="outline-none">
                Meta:{' '}
                <span className="num text-foreground font-semibold">
                  {item.target_value != null ? item.target_value.toFixed(2) : '—'}
                </span>
              </span>
            )}
            {isMeasurable(item) && item.baseline_value != null && ' · '}
            {item.baseline_value != null && (
              <>
                Actual:{' '}
                <span className="num text-foreground font-semibold">
                  {item.baseline_value.toFixed(2)}
                </span>
              </>
            )}
          </p>

          <FieldError fieldId={targetId} message={targetError} />
        </div>
      )}

      {item.comment_previews.length > 0 && (
        <div className="border-border space-y-1 border-l-2 pl-3">
          <p className="text-muted-foreground text-xs font-medium">
            Comentarios citados <span className="num">({item.comment_previews.length})</span>
          </p>
          {item.comment_previews.map((preview) => (
            <p key={preview.id} className="text-muted-foreground text-xs italic">
              “{preview.text}”
              {preview.risk_level_name && (
                <span className="not-italic">
                  {' '}
                  · riesgo {preview.risk_level_name.toLowerCase()}
                </span>
              )}
            </p>
          ))}
        </div>
      )}
    </li>
  )
})
