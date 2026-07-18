import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Period } from '../types/Period'

export interface CreatePeriodParams {
  name: string
}

/**
 * Creates a new academic period.
 *
 * @param {CreatePeriodParams} data - The data for the new period.
 * @returns {Promise<ResponseAPI<Period>>} A promise that resolves to the response containing the created period.
 */
export default function createPeriod(data: CreatePeriodParams): Promise<ResponseAPI<Period>> {
  return api.post('/academic-periods', {
    ...data,
    code: data.name,
  })
}
