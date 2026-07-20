import { useCallback } from 'react'
import { toast } from 'sonner'
import type { Period } from '../types/Period'
import useTogglePeriodStatus from './useTogglePeriodStatus'

/**
 * Custom hook to handle actions related to the status of a period (active/inactive).
 * It provides functions to activate and deactivate periods, along with their loading state.
 *
 * @returns An object containing the loading state and action handlers for period status.
 */
export default function usePeriodStatusActions() {
  const { mutateAsync: toggleStatus, isPending: isTogglingStatus } = useTogglePeriodStatus()

  const handleDeactivatePeriod = useCallback(
    async (period: Period) => {
      if (!period.active) {
        toast.info(`${period.name} ya se encuentra inactivo.`)
        return
      }

      try {
        await toggleStatus({ periodId: period.id, active: false })
        toast.success(`Periodo ${period.name} desactivado correctamente.`)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No fue posible desactivar el periodo.'
        toast.error(message)
      }
    },
    [toggleStatus],
  )

  const handleActivatePeriod = useCallback(
    async (period: Period) => {
      if (period.active) {
        toast.info(`${period.name} ya se encuentra activo.`)
        return
      }

      try {
        await toggleStatus({ periodId: period.id, active: true })
        toast.success(`Periodo ${period.name} activado correctamente.`)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No fue posible activar el periodo.'
        toast.error(message)
      }
    },
    [toggleStatus],
  )

  return {
    isTogglingStatus,
    handleDeactivatePeriod,
    handleActivatePeriod,
  }
}
