import type { User } from "@/features/auth";

export interface Teacher {
  id: number;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
  user_id?: number;
  user?: User;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherCreatePayload {
  name: string;
  email: string;
  username: string;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
}

export interface UpdateTeacherPayload {
  id: number;
  name: string;
  email: string;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
  active?: boolean;
}
