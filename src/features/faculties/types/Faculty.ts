export interface Faculty {
  id: number;
  name: string;
  code?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFacultyPayload {
  name: string;
  code?: string;
}

export interface UpdateFacultyPayload {
  name?: string;
  code?: string;
  active?: boolean;
}
