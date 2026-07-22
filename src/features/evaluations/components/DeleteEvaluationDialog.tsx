import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash } from 'lucide-react'

import type { EvaluationRecord } from '../types/Evaluation'

interface DeleteEvaluationDialogProps {
  evaluation: EvaluationRecord | null
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (id: number) => void
}

/**
 * A dialog component for confirming the deletion of an evaluation.
 *
 * @param {DeleteEvaluationDialogProps} props - The properties for the dialog.
 * @returns {JSX.Element} The rendered DeleteEvaluationDialog component.
 */
export function DeleteEvaluationDialog({
  evaluation,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteEvaluationDialogProps) {
  return (
    <AlertDialog open={evaluation !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar evaluación</AlertDialogTitle>

          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta
            evaluación.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => {
              if (evaluation) {
                onConfirm(evaluation.id)
              }
            }}
          >
            <Trash />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
