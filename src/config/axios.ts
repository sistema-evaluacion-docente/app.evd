import axios from 'axios'

import { getToken } from '@/features/auth'
import { API_URL } from '.'

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
    if (response.data?.status === 'error') {
      return Promise.reject(
        new Error(response.data?.message || response.data?.error || 'Unknown error occurred'),
      )
    }

    return response.data
  },
  (error) => {
    if (error?.response && error?.response?.data && error?.response?.data?.error) {
      return Promise.reject(
        new Error(error?.response?.data?.error?.message || 'Unknown error occurred'),
      )
    }

    return Promise.reject(error)
  },
)

export default api
