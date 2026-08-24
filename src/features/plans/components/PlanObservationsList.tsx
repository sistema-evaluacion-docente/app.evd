import { NotebookPen, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ObservationKind } from './PlanObservationsDialog'

/**
 * Las tres observaciones, en el orden en que el Formato 2 las imprime. El
 * catálogo es fijo: no son una lista que crezca, son tres casillas del formato
 * oficial, cada una con su firmante.
 */
const OBSERVATION_KINDS: { key: ObservationKind; label: string }[] = [
  { key: 'council', label: 'Consejo de departamento' },
  { key: 'department', label: 'Director de departamento' },
  { key: 'program', label: 'Director de programa' },
]

interface PlanObservationsListProps {
  council: string
  department: string
  program: string
  /** Abre el diálogo con el cursor puesto en esa observación. */
  onEdit: (kind: ObservationKind) => void
  onRemove: (kind: ObservationKind) => void
  /** Un acta firmada congela las del Consejo, que le pertenecen. */
  councilDisabled?: boolean
}

/**
 * Las observaciones ya escritas, listadas junto a los compromisos.
 *
 * Vivían sólo dentro del diálogo: se escribían, se guardaban y desaparecían de
 * la vista, y la única señal de que existían era el número en la pastilla del
 * botón. Aquí se leen sin abrir nada, y se corrigen o se quitan desde la propia
 * tarjeta, igual que un compromiso.
 *
 * Sólo se pintan las que tienen texto. Tres tarjetas vacías con su «sin
 * observaciones» son la sección larga y en blanco que el diálogo vino a quitar;
 * para añadir está el botón «Observaciones» de la cabecera del paso.
 *
 * @example
 * <PlanObservationsList council={council} department={department} program={program}
 *   onEdit={openObservations} onRemove={clearObservation} />
 */
export function PlanObservationsList({
  council,
  department,
  program,
  onEdit,
  onRemove,
  councilDisabled = false,
}: PlanObservationsListProps) {
  const values: Record<ObservationKind, string> = { council, department, program }
  const written = OBSERVATION_KINDS.filter((kind) => values[kind.key].trim().length > 0)

  if (written.length === 0) return null

  return (
    <section className="border-border rounded-md border">
      <header className="bg-muted/40 border-b px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <NotebookPen className="text-muted-foreground size-4" aria-hidden="true" />
          Observaciones
        </h3>
      </header>

      <ul className="space-y-3 p-3">
        {written.map(({ key, label }) => {
          const locked = key === 'council' && councilDisabled

          return (
            // Mismo bloque gris cerrado que las tarjetas de compromiso: apiladas
            // en la misma página, dos lenguajes distintos se leerían como dos
            // cosas distintas, y son la misma — casillas del Formato 2.
            <li key={key} className="bg-muted border-border space-y-2 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground min-w-0 text-xs">{label}</p>

                {!locked && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(key)}
                      aria-label={`Editar la observación del ${label.toLowerCase()}`}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Editar
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(key)}
                      aria-label={`Quitar la observación del ${label.toLowerCase()}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-sm whitespace-pre-line">{values[key].trim()}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
