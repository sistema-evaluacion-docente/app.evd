import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

/**
 * Delete a period by its ID.
 * @param id - The ID of the period to delete.
 * @returns A promise that resolves to a ResponseAPI object with null data.
 */
export default function deletePeriod(id: string): Promise<ResponseAPI<null>> {
  return api.delete(`/academic-periods/${id}`)
}
