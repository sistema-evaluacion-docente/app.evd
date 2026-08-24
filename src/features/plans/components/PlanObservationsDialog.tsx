import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { focusField } from '../lib/planValidation'

/** Campos planos del formulario: sin sombra y con el borde siempre visible. */
const FIELD_CLASS = 'border-border shadow-none'

/** Cuál de las tres observaciones se está editando. */
export type ObservationKind = 'council' | 'department' | 'program'

const FIELD_ID: Record<ObservationKind, string> = {
  council: 'council-obs',
  department: 'department-obs',
  program: 'program-obs',
}

export interface PlanObservationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  councilObservations: string
  onCouncilObservationsChange: (value: string) => void
  departmentObservations: string
  onDepartmentObservationsChange: (value: string) => void
  programObservations: string
  onProgramObservationsChange: (value: string) => void
  /** Un acta firmada rechaza las observaciones del Consejo, que le pertenecen. */
  councilDisabled?: boolean
  /** Campo al que saltar al abrir, cuando se entra desde una tarjeta concreta. */
  focus?: ObservationKind | null
}

/**
 * Las tres observaciones que los formatos oficiales imprimen bajo los
 * compromisos: las del Consejo de Departamento, las del director de
 * departamento y las del director de programa.
 *
 * Vivían como tres cajas de texto al pie del paso 3, casi siempre vacías, que
 * alargaban la sección y separaban el listado de compromisos del selector de
 * asignaturas. Detrás de un botón ocupan una línea, y las que ya están escritas
 * se listan como tarjetas junto a los compromisos (`PlanObservationsList`).
 *
 * Escribe sobre una copia local y sólo la vuelca al estado de la página al
 * pulsar «Guardar»: es lo que hace que «Cancelar» pueda descartar, y lo que
 * evita que cerrar con Esc deje escrito medio párrafo. La copia se rehace en
 * cada apertura remontando el formulario con una `key`, en vez de sincronizar
 * prop→estado con un efecto.
 *
 * No es un `<form>`: el diálogo se monta dentro del formulario del plan y un
 * submit anidado, aunque viaje por un portal, sube igual hasta él.
 *
 * @example
 * <PlanObservationsDialog open={open} onOpenChange={setOpen} focus="council" {...observations} />
 */
export function PlanObservationsDialog({
  open,
  onOpenChange,
  ...rest
}: PlanObservationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <ObservationsForm onClose={() => onOpenChange(false)} {...rest} />}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Los campos, separados para que el diálogo los remonte limpios en cada
 * apertura sin un efecto que copie las props al estado.
 */
function ObservationsForm({
  councilObservations,
  onCouncilObservationsChange,
  departmentObservations,
  onDepartmentObservationsChange,
  programObservations,
  onProgramObservationsChange,
  councilDisabled = false,
  focus = null,
  onClose,
}: Omit<PlanObservationsDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [council, setCouncil] = useState(councilObservations)
  const [department, setDepartment] = useState(departmentObservations)
  const [program, setProgram] = useState(programObservations)

  // El diálogo se lleva el foco al abrirse; `focusField` va en un
  // `requestAnimationFrame`, así que llega después y gana.
  useEffect(() => {
    if (focus) focusField(FIELD_ID[focus])
  }, [focus])

  function save() {
    // El acta firmada congela las observaciones del Consejo: el campo está
    // deshabilitado, y no se vuelca para que no viajen ni por accidente.
    if (!councilDisabled) onCouncilObservationsChange(council)
    onDepartmentObservationsChange(department)
    onProgramObservationsChange(program)
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Observaciones</DialogTitle>
        <DialogDescription>
          Opcionales. Se imprimen en el Formato 2, bajo los compromisos acordados.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={FIELD_ID.council}>Observaciones del Consejo de Departamento</Label>
          <Textarea
            id={FIELD_ID.council}
            rows={3}
            className={FIELD_CLASS}
            value={council}
            onChange={(event) => setCouncil(event.target.value)}
            disabled={councilDisabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={FIELD_ID.department}>Observaciones del director de departamento</Label>
          <Textarea
            id={FIELD_ID.department}
            rows={3}
            className={FIELD_CLASS}
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={FIELD_ID.program}>Observaciones del director de programa</Label>
          <Textarea
            id={FIELD_ID.program}
            rows={3}
            className={FIELD_CLASS}
            value={program}
            onChange={(event) => setProgram(event.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" onClick={save}>
          Guardar
        </Button>
      </DialogFooter>
    </>
  )
}
