import axios from 'axios'
import { toast } from 'sonner'

import { getToken } from '@/features/auth'
import { ApiError, extractApiErrorMessage } from '@/lib/apiError'
import { API_URL } from '.'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  async (config) => {
    const token = await getToken()

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    const body = response.data

    if (body && typeof body === 'object' && (body as Record<string, unknown>).status === 'error') {
      const message = extractApiErrorMessage(body) || 'Ocurrió un error inesperado'

      if (!response.config.skipErrorToast) toast.error(message)

      return Promise.reject(
        new ApiError(message, {
          code: (body as { error?: { code?: string } }).error?.code,
        }),
      )
    }

    return body
  },
  (error) => {
    const payload = error?.response?.data
    const serverMessage = extractApiErrorMessage(payload)

    let message = serverMessage

    if (!message) {
      const raw = typeof error?.message === 'string' ? error.message : ''
      message = raw && raw !== 'Network Error' ? raw : 'Ocurrió un error inesperado'
    }

    if (!error?.config?.skipErrorToast) toast.error(message)

    return Promise.reject(
      new ApiError(message, {
        status: error?.response?.status,
        code: payload?.error?.code,
      }),
    )
  },
)

export default api
