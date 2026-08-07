import type { VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

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
import type { buttonVariants } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  onConfirm: () => void
  isPending?: boolean
  confirmLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  confirmVariant?: VariantProps<typeof buttonVariants>['variant']
  confirmIcon?: ReactNode
  size?: 'default' | 'sm'
  contentClassName?: string
}

/**
 * Reusable confirmation dialog for destructive or decisive actions.
 *
 * @example
 * <ConfirmDialog
 *   open={target !== null}
 *   title="Eliminar evaluación"
 *   description="Esta acción no se puede deshacer."
 *   confirmLabel="Eliminar"
 *   pendingLabel="Eliminando..."
 *   isPending={isDeleting}
 *   confirmIcon={<Trash />}
 *   onOpenChange={(open) => !open && setTarget(null)}
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description = 'Esta acción no se puede deshacer. Se eliminarán todos los datos.',
  onConfirm,
  isPending = false,
  confirmLabel = 'Eliminar',
  pendingLabel = 'Eliminando...',
  cancelLabel = 'Cancelar',
  confirmVariant = 'destructive',
  confirmIcon,
  size = 'default',
  contentClassName,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size={size} className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>

          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>

          <AlertDialogAction variant={confirmVariant} disabled={isPending} onClick={onConfirm}>
            {confirmIcon ? <span aria-hidden="true">{confirmIcon}</span> : null}
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
