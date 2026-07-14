import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface AdminDashboardCounts {
  departments: number;
  faculties: number;
  users: number;
  active_users: number;
  teachers: number;
  evaluations: number;
  academic_periods: number;
  active_periods: number;
}

export interface AdminAuditItem {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_avatar: string | null;
  table_name: string | null;
  operation: string | null;
  element: string | null;
  description: string | null;
  created_at: string | null;
}

export interface AdminPeriodItem {
  id: number;
  code: string;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
}

export interface AdminDashboardData {
  counts: AdminDashboardCounts;
  recent_audits: AdminAuditItem[];
  periods: AdminPeriodItem[];
}

export default function getAdminDashboard(): Promise<
  ResponseAPI<AdminDashboardData>
> {
  return api.get("/admin/dashboard/");
}
