export interface Audit {
  id: number
  user_id: string

  user: {
    id: number
    name: string
    avatar_url: string
    email: string
  }

  table_name: string
  operation: string
  created_at: string
  updated_at: string
  element: string
  description: string
  element_data: string
}

export interface AuditResponse {
  status: 'success' | 'error'
  message: string
  data: Audit[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  error: string | null
}
