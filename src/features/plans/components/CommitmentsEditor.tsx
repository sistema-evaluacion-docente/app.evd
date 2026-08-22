import { useMemo } from 'react'
import { ChevronRight, Lightbulb, Trash2 } from 'lucide-react'

import { FieldError } from '@/components/common/FieldError'
import { Required } from '@/components/common/Required'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fieldErrorId } from '@/lib/fieldErrorId'
import { commitmentFieldId, isMeasurable, itemsInPaintedOrder } from '../lib/planValidation'
import type { DraftItem, PlanAspect } from '../types'

interface CommitmentsEditorProps {
  items: DraftItem[]
  aspects: PlanAspect[]
  onChange: (key: string, patch: Partial<DraftItem>) => void
  onRemove: (key: string) => void
  /**
   * The fields to paint red, each against what is missing from it. The page
   * decides when one enters the map; the message is what the field says out
   * loud once it is in there.
   */
  invalidFields: ReadonlyMap<string, string>
  /** Leaving a required field empty is what makes it red the first time. */
  onFieldBlur: (id: string) => void
  disabled?: boolean
}

/**
 * The commitments of a plan, laid out as the sections of the official forms:
 * the four evaluation dimensions plus "Observaciones de los Estudiantes". Each
 * row keeps the indicator description and the commitment apart, because
 * Formato 2 prints them as two separate blocks.
 *
 * Only the aspects the director actually picked something for are drawn. Empty
 * ones used to be listed with a "sin compromisos" line each, which filled the
 * page with sections nobody was going to touch.
 *
 * @example
 * <CommitmentsEditor items={items} aspects={aspects} onChange={patch} onRemove={remove}
 *   invalidFields={invalid} onFieldBlur={touch} />
 */
export function CommitmentsEditor({
  items,
  aspects,
  onChange,
  onRemove,
  invalidFields,
  onFieldBlur,
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

  return (
    <div className="space-y-4">
      {filled.map((aspect) => (
        <section key={aspect.aspect} className="border-border rounded-md border">
          <header className="bg-muted/40 border-b px-4 py-2.5">
            <h3 className="text-sm font-semibold">
              <span className="text-muted-foreground num mr-1.5">{aspect.aspect}.</span>
              {aspect.label}
            </h3>
          </header>

          <ul className="space-y-3 p-3">
            {items
              .filter((item) => item.aspect === aspect.aspect)
              .map((item) => (
                <CommitmentRow
                  key={item.key}
                  item={item}
                  number={numbers.get(item.key) ?? 0}
                  onChange={onChange}
                  onRemove={onRemove}
                  invalidFields={invalidFields}
                  onFieldBlur={onFieldBlur}
                  disabled={disabled}
                />
              ))}
          </ul>
        </section>
      ))}

      {orphans.length > 0 && (
        <section className="border-border rounded-md border border-dashed">
          <header className="bg-muted/40 border-b px-4 py-2.5">
            <h3 className="text-sm font-semibold">Sin aspecto asignado</h3>
            <p className="text-muted-foreground text-xs">
              Estos compromisos no se imprimirán en los formatos hasta que elijas un aspecto.
            </p>
          </header>

          <ul className="space-y-3 p-3">
            {orphans.map((item) => (
              <CommitmentRow
                key={item.key}
                item={item}
                number={numbers.get(item.key) ?? 0}
                onChange={onChange}
                onRemove={onRemove}
                invalidFields={invalidFields}
                onFieldBlur={onFieldBlur}
                disabled={disabled}
                showAspectPicker
                aspects={aspects}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function CommitmentRow({
  item,
  number,
  onChange,
  onRemove,
  invalidFields,
  onFieldBlur,
  disabled,
  showAspectPicker = false,
  aspects = [],
}: {
  item: DraftItem
  /** Position in the plan as a whole: the card is titled "Compromiso N". */
  number: number
  onChange: (key: string, patch: Partial<DraftItem>) => void
  onRemove: (key: string) => void
  invalidFields: ReadonlyMap<string, string>
  onFieldBlur: (id: string) => void
  disabled: boolean
  showAspectPicker?: boolean
  aspects?: PlanAspect[]
}) {
  const descriptionId = commitmentFieldId.description(item.key)
  const commitmentId = commitmentFieldId.commitment(item.key)
  const targetId = commitmentFieldId.target(item.key)
  const aspectId = commitmentFieldId.aspect(item.key)

  return (
    // The card is one closed grey block with white fields inside: stacked on a
    // white page they blurred into one another, and a director filling several
    // in a row could not tell where one ended and the next began.
    <li className="bg-muted border-border space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Compromiso <span className="num">{number}</span>
        </p>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onRemove(item.key)}
          disabled={disabled}
          aria-label={`Quitar compromiso ${number}`}
          className="shrink-0"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {showAspectPicker && (
        <div className="space-y-1.5">
          <Label htmlFor={aspectId} className="text-xs">
            Aspecto del formato <Required />
          </Label>
          <Select
            value={item.aspect}
            onValueChange={(value) => onChange(item.key, { aspect: value as number | null })}
            disabled={disabled}
          >
            <SelectTrigger
              id={aspectId}
              className="bg-background w-full max-w-md"
              aria-invalid={invalidFields.has(aspectId)}
              aria-describedby={invalidFields.has(aspectId) ? fieldErrorId(aspectId) : undefined}
              onBlur={() => onFieldBlur(aspectId)}
            >
              <SelectValue placeholder="Elige el aspecto…">
                {item.aspect != null
                  ? `${item.aspect}. ${
                      aspects.find((aspect) => aspect.aspect === item.aspect)?.label ?? ''
                    }`
                  : undefined}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {aspects.map((aspect) => (
                <SelectItem key={aspect.aspect} value={aspect.aspect}>
                  {aspect.aspect}. {aspect.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FieldError fieldId={aspectId} message={invalidFields.get(aspectId)} />
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={descriptionId} className="text-xs">
            Descripción del indicador comprometido <Required />
          </Label>
          {item.source_subject_label && (
            <Badge variant="outline" className="bg-background font-normal">
              {item.source_subject_label}
            </Badge>
          )}
        </div>
        <Textarea
          id={descriptionId}
          className="bg-background"
          value={item.description}
          onChange={(event) => onChange(item.key, { description: event.target.value })}
          onBlur={() => onFieldBlur(descriptionId)}
          aria-invalid={invalidFields.has(descriptionId)}
          aria-describedby={
            invalidFields.has(descriptionId) ? fieldErrorId(descriptionId) : undefined
          }
          rows={2}
          disabled={disabled}
          placeholder="Describe la situación detectada"
        />

        <FieldError fieldId={descriptionId} message={invalidFields.get(descriptionId)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={commitmentId} className="text-xs">
          Compromiso <Required />
        </Label>
        <Textarea
          id={commitmentId}
          className="bg-background"
          value={item.commitment}
          onChange={(event) => onChange(item.key, { commitment: event.target.value })}
          onBlur={() => onFieldBlur(commitmentId)}
          aria-invalid={invalidFields.has(commitmentId)}
          aria-describedby={
            invalidFields.has(commitmentId) ? fieldErrorId(commitmentId) : undefined
          }
          rows={2}
          disabled={disabled}
          placeholder="Acción concreta que se compromete a realizar el docente"
        />

        <FieldError fieldId={commitmentId} message={invalidFields.get(commitmentId)} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {isMeasurable(item) && (
          <div className="space-y-1.5">
            <Label htmlFor={targetId} className="text-xs">
              Meta esperada <Required />
            </Label>
            <Input
              id={targetId}
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="bg-background w-28"
              // Starts empty on purpose: seeded with the threshold it read as
              // already decided and nobody looked at it again.
              value={item.target_value ?? ''}
              onChange={(event) =>
                onChange(item.key, {
                  target_value: event.target.value === '' ? null : Number(event.target.value),
                })
              }
              onBlur={() => onFieldBlur(targetId)}
              aria-invalid={invalidFields.has(targetId)}
              aria-describedby={invalidFields.has(targetId) ? fieldErrorId(targetId) : undefined}
              disabled={disabled}
            />

            <FieldError fieldId={targetId} message={invalidFields.get(targetId)} />
          </div>
        )}

        {item.baseline_value != null && (
          <p className="text-muted-foreground pb-2 text-xs">
            Valor actual:{' '}
            <span className="num font-semibold">{item.baseline_value.toFixed(2)}</span>
          </p>
        )}
      </div>

      {item.suggestions.length > 0 && (
        <Collapsible className="text-muted-foreground text-xs">
          <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1.5">
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
            />
            <Lightbulb className="size-3.5" aria-hidden="true" />
            Acciones sugeridas ({item.suggestions.length})
          </CollapsibleTrigger>

          <CollapsibleContent>
            <ul className="mt-1.5 space-y-1 pl-5">
              {item.suggestions.map((suggestion) => (
                <li key={suggestion} className="list-disc">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled={disabled}
                    className="h-auto justify-start px-0 py-0 text-left text-xs font-normal whitespace-normal"
                    onClick={() => onChange(item.key, { commitment: suggestion })}
                  >
                    {suggestion}
                  </Button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
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
}
