import { ChevronRight, Lightbulb, Trash2 } from 'lucide-react'

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
import type { PlanAspect } from '../types'

/** A commitment being drafted before the plan is saved. */
export interface DraftItem {
  /** Client-side id so React can key rows that have no server id yet. */
  key: string
  id?: number
  description: string
  commitment: string
  aspect: number | null
  target_type: 'DIMENSION' | 'QUESTION' | 'OVERALL_AVERAGE' | 'QUALITATIVE'
  target_ref: string | null
  baseline_value: number | null
  target_value: number | null
  suggestions: string[]
  comment_ids: number[]
}

interface CommitmentsEditorProps {
  items: DraftItem[]
  aspects: PlanAspect[]
  onChange: (key: string, patch: Partial<DraftItem>) => void
  onRemove: (key: string) => void
  /** Adds an empty qualitative commitment under a given aspect. */
  onAddQualitative: (aspect: number) => void
  disabled?: boolean
}

/**
 * The commitments of a plan, laid out as the five sections of the official
 * forms: the four evaluation dimensions plus "Observaciones de los Estudiantes".
 * Each row keeps the indicator description and the commitment apart, because
 * Formato 2 prints them as two separate blocks.
 *
 * @example
 * <CommitmentsEditor items={items} aspects={aspects} onChange={patch} onRemove={remove} />
 */
export function CommitmentsEditor({
  items,
  aspects,
  onChange,
  onRemove,
  onAddQualitative,
  disabled = false,
}: CommitmentsEditorProps) {
  return (
    <div className="space-y-4">
      {aspects.map((aspect) => {
        const aspectItems = items.filter((item) => item.aspect === aspect.aspect)

        return (
          <section key={aspect.aspect} className="border-border rounded-md border">
            <header className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold">
                <span className="text-muted-foreground num mr-1.5">{aspect.aspect}.</span>
                {aspect.label}
              </h3>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onAddQualitative(aspect.aspect)}
                disabled={disabled}
              >
                Añadir compromiso
              </Button>
            </header>

            {aspectItems.length === 0 ? (
              <p className="text-muted-foreground px-4 py-3 text-sm">
                Sin compromisos en este aspecto.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {aspectItems.map((item) => (
                  <CommitmentRow
                    key={item.key}
                    item={item}
                    onChange={onChange}
                    onRemove={onRemove}
                    disabled={disabled}
                  />
                ))}
              </ul>
            )}
          </section>
        )
      })}

      {items.some((item) => item.aspect == null) && (
        <section className="border-border rounded-md border border-dashed">
          <header className="bg-muted/40 border-b px-4 py-2.5">
            <h3 className="text-sm font-semibold">Sin aspecto asignado</h3>
            <p className="text-muted-foreground text-xs">
              Estos compromisos no se imprimirán en los formatos hasta que elijas un aspecto.
            </p>
          </header>

          <ul className="divide-border divide-y">
            {items
              .filter((item) => item.aspect == null)
              .map((item) => (
                <CommitmentRow
                  key={item.key}
                  item={item}
                  onChange={onChange}
                  onRemove={onRemove}
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
  onChange,
  onRemove,
  disabled,
  showAspectPicker = false,
  aspects = [],
}: {
  item: DraftItem
  onChange: (key: string, patch: Partial<DraftItem>) => void
  onRemove: (key: string) => void
  disabled: boolean
  showAspectPicker?: boolean
  aspects?: PlanAspect[]
}) {
  const isMeasurable = item.target_type === 'DIMENSION' || item.target_type === 'QUESTION'

  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`desc-${item.key}`} className="text-xs">
            Descripción del indicador comprometido
          </Label>
          <Textarea
            id={`desc-${item.key}`}
            value={item.description}
            onChange={(event) => onChange(item.key, { description: event.target.value })}
            rows={2}
            disabled={disabled}
            placeholder="Describe la situación detectada"
          />
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onRemove(item.key)}
          disabled={disabled}
          aria-label="Quitar compromiso"
          className="mt-5 shrink-0"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`commit-${item.key}`} className="text-xs">
          Compromiso
        </Label>
        <Textarea
          id={`commit-${item.key}`}
          value={item.commitment}
          onChange={(event) => onChange(item.key, { commitment: event.target.value })}
          rows={2}
          disabled={disabled}
          placeholder="Acción concreta que se compromete a realizar el docente"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {isMeasurable && (
          <div className="space-y-1.5">
            <Label htmlFor={`target-${item.key}`} className="text-xs">
              Meta esperada
            </Label>
            <Input
              id={`target-${item.key}`}
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="w-28"
              value={item.target_value ?? ''}
              onChange={(event) =>
                onChange(item.key, {
                  target_value: event.target.value === '' ? null : Number(event.target.value),
                })
              }
              disabled={disabled}
            />
          </div>
        )}

        {item.baseline_value != null && (
          <p className="text-muted-foreground pb-2 text-xs">
            Valor actual: <span className="num font-semibold">{item.baseline_value.toFixed(2)}</span>
          </p>
        )}

        {showAspectPicker && (
          <div className="space-y-1.5">
            <Label htmlFor={`aspect-${item.key}`} className="text-xs">
              Aspecto del formato
            </Label>
            <Select
              value={item.aspect}
              onValueChange={(value) => onChange(item.key, { aspect: value as number | null })}
              disabled={disabled}
            >
              <SelectTrigger id={`aspect-${item.key}`} className="w-64">
                <SelectValue placeholder="Sin asignar">
                  {item.aspect != null
                    ? `${item.aspect}. ${
                        aspects.find((aspect) => aspect.aspect === item.aspect)?.label ?? ''
                      }`
                    : undefined}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={null}>Sin asignar</SelectItem>
                {aspects.map((aspect) => (
                  <SelectItem key={aspect.aspect} value={aspect.aspect}>
                    {aspect.aspect}. {aspect.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      {item.comment_ids.length > 0 && (
        <p className="text-muted-foreground text-xs">
          <span className="num font-semibold">{item.comment_ids.length}</span> comentario(s) de
          estudiantes citados
        </p>
      )}
    </li>
  )
}
