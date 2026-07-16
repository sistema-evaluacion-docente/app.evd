export interface DepartmentDirector {
  id: number;
  name: string;
  avatar_url: string;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  faculty_id?: number;
  director?: DepartmentDirector | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code?: string;
  faculty_id?: number;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  faculty_id?: number;
  active?: boolean;
}
