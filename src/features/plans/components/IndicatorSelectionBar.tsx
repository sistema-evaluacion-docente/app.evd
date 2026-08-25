import { ArrowRight, Eraser, ListChecks, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { IndicatorSelection, SelectionEntry } from '../hooks/useIndicatorSelection'

interface IndicatorSelectionBarProps {
  selection: IndicatorSelection
  /**
   * The weak indicators of the period, for the shortcut that marks them all.
   * Teacher level only: "los bajos" of one asignatura would need saying which,
   * and the reader is looking at the whole profile.
   */
  weakEntries?: SelectionEntry[]
}

/**
 * The bar that holds a selection together while the director scrolls.
 *
 * A profile is a long page, and its indicators live inside collapsibles: ticked
 * boxes scattered down it, with no running count and no way out, is a selection
 * a director loses. So the mode comes with one fixed place that says how many
 * are marked, lists them back, and carries them to the form.
 *
 * @example
 * <IndicatorSelectionBar selection={selection} weakEntries={weak} />
 */
export function IndicatorSelectionBar({ selection, weakEntries = [] }: IndicatorSelectionBarProps) {
  const { count, entries, existingPlanId } = selection

  const pendingWeak = weakEntries.filter(
    (entry) => !selection.isSelected(entry.kind, entry.ref, entry.subjectKey),
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <div className="border-border bg-card pointer-events-auto flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-lg border p-3 shadow-lg">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ListChecks className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />

          <p className="truncate text-sm font-medium">
            {count === 0 ? (
              <span className="text-muted-foreground font-normal">
                Marque los indicadores y comentarios que el plan debe atender.
              </span>
            ) : (
              <>
                <span className="num">{count}</span>{' '}
                {count === 1 ? 'indicador marcado' : 'indicadores marcados'}
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Offered rather than pre-applied: a selection made for the director
              is a decision taken from him. */}
          {pendingWeak.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => selection.markMany(pendingWeak)}>
              <Sparkles className="size-4" aria-hidden="true" />
              Marcar los <span className="num">{pendingWeak.length}</span> bajos
            </Button>
          )}

          {count > 0 && (
            <Popover>
              <PopoverTrigger render={<Button type="button" variant="outline" size="sm" />}>
                Ver selección
              </PopoverTrigger>

              <PopoverContent align="end" className="w-80 p-0">
                <ul className="divide-border max-h-72 divide-y overflow-y-auto">
                  {entries.map(([id, entry]) => (
                    <li key={id} className="flex items-start gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{entry.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {entry.subjectLabel ?? 'Todas las asignaturas'}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => selection.remove(id)}
                        aria-label={`Quitar ${entry.label}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>

                <div className="border-border border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={selection.clear}
                  >
                    <Eraser className="size-4" aria-hidden="true" />
                    Limpiar la selección
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button variant="ghost" size="sm" onClick={selection.cancel}>
            Cancelar
          </Button>

          <Button size="sm" disabled={count === 0} onClick={selection.submit}>
            {existingPlanId != null ? 'Agregar al plan' : 'Crear plan'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
