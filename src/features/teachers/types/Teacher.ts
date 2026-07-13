import type { User } from "@/features/auth";

export interface Teacher {
  id: number;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
  user_id?: number;
  user?: User;
  active: boolean;
  overall_average?: number | null;
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

export interface TeacherHistoryEntry {
  evaluation_id: number;
  period_code: string;
  period_name: string;
  overall_average: number;
  group_count: number;
}

export interface TeacherHistoryData {
  teacher_id: number;
  institutional_code: string;
  name: string;
  history: TeacherHistoryEntry[];
}
