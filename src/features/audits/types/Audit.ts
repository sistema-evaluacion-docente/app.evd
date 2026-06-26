export interface Audit {
  id: number;
  user_id: string;
  table_name: string;
  operation: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_avatar: string;
  element: string;
  description: string;
  element_data: string;
}

export interface AuditResponse {
  status: number;
  message: string;
  data: Audit[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  error: string | null;
}
