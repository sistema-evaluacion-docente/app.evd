import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  /** Whether the action behind the button is still running. */
  pending?: boolean
  /**
   * Label shown while pending, e.g. "Guardando…". Left out on icon-only
   * buttons, where the spinner replaces the icon and speaks for itself.
   */
  pendingLabel?: string
}

/**
 * Button that says out loud that it is working. A disabled button only stops
 * responding, which reads as a broken control on a slow save.
 *
 * @example
 * <LoadingButton pending={save.isPending} pendingLabel="Guardando…" onClick={save}>
 *   Guardar
 * </LoadingButton>
 */
export function LoadingButton({
  pending = false,
  pendingLabel,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending ? (
        <>
          <Spinner className="size-4" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
