import { type SubmitEvent, useMemo, useState } from 'react'

import { FieldError } from '@/components/common/FieldError'
import { Required } from '@/components/common/Required'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { getScoreToneClass } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'
// Deep-imported from the feature's `types` barrel rather than its root on
// purpose: `features/suggested-actions` imports `features/plans` for the aspect
// catalogue, so going through the barrel would close an import cycle.
import type { SuggestedAction } from '@/features/suggested-actions/types'
import { appendSuggestedAction } from '../lib/commitmentText'
import {
  commitmentErrors,
  commitmentFieldId,
  focusField,
  hasDerivedTitle,
  isMeasurable,
  SCORE_MAX,
  SCORE_MIN,
} from '../lib/planValidation'
import type { DraftItem, PlanAspect } from '../types'
import { CommitmentSuggestions } from './CommitmentSuggestions'

/** Nothing touched yet — a module constant so it isn't a new `Set` per render. */
const NOTHING_TOUCHED: ReadonlySet<string> = new Set()

/**
 * The dialog writes the same commitment the summary card behind it is printing,
 * and both anchor their fields on `commitmentFieldId`. Two elements sharing one
 * id break the label association and send `focusField` to whichever came first
 * in the document — the card — so the dialog's own controls live under a prefix
 * and the errors are translated onto it on the way in.
 */
function dialogFieldId(id: string): string {
  return `dialog-${id}`
}

export interface CommitmentDialogProps {
  /** The commitment being written, or `null` while the dialog is closed. */
  draft: DraftItem | null
  /** `create` adds it to the plan on save, `edit` replaces the one already in it. */
  mode: 'create' | 'edit'
  /** The five aspects of the official forms, for a row that still has none. */
  aspects: PlanAspect[]
  /** The department's defaults (`/acciones`), narrowed here to this aspect. */
  defaultActions?: SuggestedAction[]
  /** Hands back the finished commitment; only fires once it is complete. */
  onSave: (draft: DraftItem) => void
  onCancel: () => void
}

/**
 * Writes one commitment without leaving the indicator matrix.
 *
 * Picking an indicator used to drop a half-empty card into section 3, so the
 * director had to scroll down to fill it in and back up to pick the next one —
 * once per commitment. The pick now opens this dialog instead, and the draft
 * only reaches the plan when it is saved: cancelling leaves nothing behind, and
 * the picker button never sits on "Agregado" for a commitment that was never
 * written.
 *
 * @example
 * <CommitmentDialog
 *   key={pending?.draft.key ?? 'none'}
 *   draft={pending?.draft ?? null}
 *   mode={pending?.mode ?? 'create'}
 *   aspects={aspects}
 *   defaultActions={defaultActions}
 *   onSave={commitPending}
 *   onCancel={() => setPending(null)}
 * />
 */
export function CommitmentDialog({ draft, onCancel, ...rest }: CommitmentDialogProps) {
  return (
    <Dialog
      open={draft != null}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {draft && <CommitmentForm draft={draft} onCancel={onCancel} {...rest} />}
      </DialogContent>
    </Dialog>
  )
}

/**
 * The fields themselves, split off so the page can remount them with a `key`
 * and get a clean copy of the draft without an effect syncing prop to state.
 */
function CommitmentForm({
  draft,
  mode,
  aspects,
  defaultActions = [],
  onSave,
  onCancel,
}: CommitmentDialogProps & { draft: DraftItem }) {
  const [item, setItem] = useState<DraftItem>(draft)
  const [touched, setTouched] = useState<ReadonlySet<string>>(NOTHING_TOUCHED)
  const [showAllErrors, setShowAllErrors] = useState(false)

  const errors = useMemo(() => commitmentErrors(item), [item])

  // A field only turns red once it has been left empty or the save was refused:
  // opening the dialog on a blank commitment and finding it already in red
  // reads as a mistake the director hasn't had the chance to make yet.
  const invalidFields = useMemo(
    () =>
      new Map(
        errors
          .filter((error) => showAllErrors || touched.has(dialogFieldId(error.id)))
          .map((error) => [dialogFieldId(error.id), error.message]),
      ),
    [errors, showAllErrors, touched],
  )

  const actions = useMemo(
    () =>
      item.aspect == null ? [] : defaultActions.filter((action) => action.aspect === item.aspect),
    [defaultActions, item.aspect],
  )

  const descriptionId = dialogFieldId(commitmentFieldId.description(item.key))
  const commitmentId = dialogFieldId(commitmentFieldId.commitment(item.key))
  const targetId = dialogFieldId(commitmentFieldId.target(item.key))
  const aspectId = dialogFieldId(commitmentFieldId.aspect(item.key))

  // Read from the draft the dialog opened with, not from the live copy: keyed
  // off the current aspect the picker would vanish the moment one is chosen.
  const needsAspect = draft.aspect == null
  const titleIsFixed = hasDerivedTitle(item)

  function patch(values: Partial<DraftItem>) {
    setItem((current) => ({ ...current, ...values }))
  }

  function markTouched(id: string) {
    setTouched((current) => (current.has(id) ? current : new Set(current).add(id)))
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    // React propagates events through its own tree, not the DOM one, so a
    // portal is no insulation: without this the page's `<form>` receives this
    // very submit and tries to save the whole plan — answering "faltan campos
    // obligatorios" to someone who only pressed Guardar on one commitment.
    event.stopPropagation()

    if (errors.length > 0) {
      setShowAllErrors(true)
      focusField(dialogFieldId(errors[0].id))
      return
    }

    onSave(item)
  }

  return (
    // A real form, so Enter saves. It renders through the dialog's portal, so
    // it is not nested inside the page's own form despite being written there.
    <form onSubmit={submit} noValidate className="contents">
      <DialogHeader>
        <DialogTitle className="pr-6">
          {mode === 'edit' ? 'Editar compromiso' : 'Nuevo compromiso'}
        </DialogTitle>
        <DialogDescription>
          Se imprime en el Formato 2, bajo el aspecto al que pertenece.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {titleIsFixed ? (
          <div className="bg-muted border-border space-y-1 rounded-md border p-3">
            <p className="text-muted-foreground text-xs">Indicador comprometido</p>

            <div className="flex flex-wrap items-center gap-2">
              {/* `tabIndex` so a refused save can still put the cursor here
                  when the description is what is missing — it can only be so
                  on a plan that came back from the API without one. */}
              <p id={descriptionId} tabIndex={-1} className="text-sm font-medium outline-none">
                {item.description}
              </p>

              {item.source_subject_label && (
                <Badge variant="outline" className="bg-background font-normal">
                  {item.source_subject_label}
                </Badge>
              )}
            </div>

            <FieldError fieldId={descriptionId} message={invalidFields.get(descriptionId)} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor={descriptionId}>
              Título del compromiso <Required />
            </Label>
            <Textarea
              id={descriptionId}
              rows={2}
              value={item.description}
              onChange={(event) => patch({ description: event.target.value })}
              onBlur={() => markTouched(descriptionId)}
              aria-invalid={Boolean(invalidFields.get(descriptionId))}
              aria-describedby={
                invalidFields.get(descriptionId) ? fieldErrorId(descriptionId) : undefined
              }
              placeholder="Describe la situación detectada"
            />

            <FieldError fieldId={descriptionId} message={invalidFields.get(descriptionId)} />
          </div>
        )}

        {needsAspect && (
          <div className="space-y-1.5">
            <Label htmlFor={aspectId}>
              Aspecto del formato <Required />
            </Label>
            <Select
              value={item.aspect}
              onValueChange={(value) => patch({ aspect: value as number | null })}
            >
              <SelectTrigger
                id={aspectId}
                className="w-full"
                aria-invalid={Boolean(invalidFields.get(aspectId))}
                aria-describedby={invalidFields.get(aspectId) ? fieldErrorId(aspectId) : undefined}
                onBlur={() => markTouched(aspectId)}
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
          <Label htmlFor={commitmentId}>
            Descripción del compromiso <Required />
          </Label>
          <Textarea
            id={commitmentId}
            rows={3}
            value={item.commitment}
            onChange={(event) => patch({ commitment: event.target.value })}
            onBlur={() => markTouched(commitmentId)}
            aria-invalid={Boolean(invalidFields.get(commitmentId))}
            aria-describedby={
              invalidFields.get(commitmentId) ? fieldErrorId(commitmentId) : undefined
            }
            placeholder="Acción concreta que se compromete a realizar el docente"
          />

          <FieldError fieldId={commitmentId} message={invalidFields.get(commitmentId)} />

          <CommitmentSuggestions
            departmentActions={actions}
            onPick={(action) =>
              patch({ commitment: appendSuggestedAction(item.commitment, action) })
            }
          />
        </div>

        {isMeasurable(item) && (
          <div className="space-y-1.5">
            <Label htmlFor={targetId}>
              Meta esperada <Required />
            </Label>

            <div className="flex flex-wrap items-center gap-3">
              <Input
                id={targetId}
                type="number"
                step="0.1"
                min={SCORE_MIN}
                max={SCORE_MAX}
                className="w-28"
                value={item.target_value ?? ''}
                onChange={(event) => {
                  const inputValue = event.target.value;
                  if (inputValue === '') {
                    patch({ target_value: null });
                    return; 
                  }
              
                  const numericValue = Number(inputValue);
              
                  if (numericValue < SCORE_MIN || numericValue > SCORE_MAX) {
                    return; 
                  }
              
                  // 3. Si pasa la validación, actualizamos el estado
                  patch({ target_value: numericValue });
                }}
                onBlur={() => markTouched(targetId)}
                aria-invalid={Boolean(invalidFields.get(targetId))}
                aria-describedby={invalidFields.get(targetId) ? fieldErrorId(targetId) : undefined}
              />

              <p className="text-muted-foreground text-sm">
                {item.baseline_value != null ? (
                  <>
                    Nota actual:{' '}
                    <span
                      className={cn('num font-semibold', getScoreToneClass(item.baseline_value))}
                    >
                      {item.baseline_value.toFixed(2)}
                    </span>
                  </>
                ) : (
                  'Sin nota registrada'
                )}
                <span className="text-muted-foreground/70">
                  {' '}
                  · escala de {SCORE_MIN} a {SCORE_MAX}
                </span>
              </p>
            </div>

            <FieldError fieldId={targetId} message={invalidFields.get(targetId)} />
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
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  )
}
