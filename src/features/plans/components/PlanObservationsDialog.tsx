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

/** Campos planos del formulario: sin sombra y con el borde siempre visible. */
const FIELD_CLASS = 'border-border shadow-none'

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
}

/**
 * Las tres observaciones que los formatos oficiales imprimen bajo los
 * compromisos: las del Consejo de Departamento, las del director de
 * departamento y las del director de programa.
 *
 * Vivían como tres cajas de texto al pie del paso 3, casi siempre vacías, que
 * alargaban la sección y separaban el listado de compromisos del selector de
 * asignaturas. Detrás de un botón ocupan una línea y siguen a un clic de
 * distancia, con el número de las que ya están escritas en la propia pastilla.
 *
 * Escriben directo en el estado de la página — no hay «guardar» que pulsar ni
 * copia local que sincronizar — así que el pie sólo cierra. Tampoco es un
 * `<form>`: el diálogo se monta dentro del formulario del plan y un submit
 * anidado, aunque viaje por un portal, sube igual hasta él.
 *
 * @example
 * <PlanObservationsDialog open={open} onOpenChange={setOpen} {...observations} />
 */
export function PlanObservationsDialog({
  open,
  onOpenChange,
  councilObservations,
  onCouncilObservationsChange,
  departmentObservations,
  onDepartmentObservationsChange,
  programObservations,
  onProgramObservationsChange,
  councilDisabled = false,
}: PlanObservationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Observaciones</DialogTitle>
          <DialogDescription>
            Opcionales. Se imprimen en el Formato 2, bajo los compromisos acordados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="council-obs">Observaciones del Consejo de Departamento</Label>
            <Textarea
              id="council-obs"
              rows={3}
              className={FIELD_CLASS}
              value={councilObservations}
              onChange={(event) => onCouncilObservationsChange(event.target.value)}
              disabled={councilDisabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="department-obs">Observaciones del director de departamento</Label>
            <Textarea
              id="department-obs"
              rows={3}
              className={FIELD_CLASS}
              value={departmentObservations}
              onChange={(event) => onDepartmentObservationsChange(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="program-obs">Observaciones del director de programa</Label>
            <Textarea
              id="program-obs"
              rows={3}
              className={FIELD_CLASS}
              value={programObservations}
              onChange={(event) => onProgramObservationsChange(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
