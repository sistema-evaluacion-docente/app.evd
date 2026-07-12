import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherRankingItem {
  teacher_id: number;
  institutional_code: string;
  name: string;
  avatar_url: string | null;
  contract_type: string | null;
  group_count: number;
  overall_average: number | null;
}

export function getTeacherRanking(
  page: number,
  limit: number,
  search: string,
  sort: "asc" | "desc",
  academicPeriodId?: number,
  departmentId?: number,
): Promise<ResponseAPI<TeacherRankingItem[]>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("sort", sort);
  if (search) params.set("search", search);
  if (academicPeriodId) params.set("academic_period_id", String(academicPeriodId));
  if (departmentId) params.set("department_id", String(departmentId));

  return api.get(`/stats/teacher-ranking?${params.toString()}`);
}
