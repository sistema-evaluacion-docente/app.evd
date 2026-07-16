import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface CreateDirectorPayload {
  email: string
  name: string
  username: string
  uid: string
  avatar_url: string
  institutional_code: string
  contract_type: string
  department_id: number
}

/**
 * Creates a new director by making a POST request to the API.
 *
 * @param data The payload containing the director's information.
 * @returns A promise that resolves to a ResponseAPI containing the created director's information.
 */
export default function createDirector(
  data: CreateDirectorPayload,
): Promise<ResponseAPI<CreateDirectorPayload>> {
  return api.post('/directors', data)
}
