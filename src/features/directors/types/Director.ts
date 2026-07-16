import type { User } from "@/features/auth";
import type { Department } from "@/features/departments";

export interface Director {
  id: number;
  user_id: number;
  department_id: number;
  user?: User;
  department?: Department;
  active: boolean;
  created_at: string;
  updated_at: string;
}
