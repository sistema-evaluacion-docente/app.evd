export interface Department {
  id: number;
  name: string;
  code?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  active?: boolean;
}
