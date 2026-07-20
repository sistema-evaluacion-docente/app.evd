import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Period } from '../types/Period'

interface TogglePeriodStatusParams {
  periodId: string
  active: boolean
}

/**
 * Toggles the status of a period (active/inactive).
 * @param periodId - The ID of the period to toggle.
 * @param active - The desired status of the period (true for active, false for inactive).
 * @returns A promise that resolves to the updated period data.
 */
export default function togglePeriodStatus({
  periodId,
  active,
}: TogglePeriodStatusParams): Promise<ResponseAPI<Period>> {
  if (!active) {
    return api.patch(`/academic-periods/${periodId}/close`)
  }

  return api.patch(`/academic-periods/${periodId}/activate`)
}
