import api from '@/config/axios'
import type { User } from '@/features/auth/types/User'
import type { ResponseAPI } from '@/shared/types/Response'

export interface CreateUserPayload {
  name: string
  email: string
  institutional_code: string
  contract_type?: string
  department_id: number
  roles: string[]
}

/**
 * Creates a new user.
 * @param data - The data for the new user.
 * @returns A promise that resolves to the response from the API.
 */
export default function createUser(data: CreateUserPayload): Promise<ResponseAPI<User>> {
  return api.post('/users', data)
}
