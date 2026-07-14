import type { UseQueryResult } from "@tanstack/react-query";

import { useGetTeacherRanking } from "@/features/stats";
import type { TeacherRankingItem } from "@/features/stats";
import type { ResponseAPI } from "@/shared/types/Response";

export function createTeacherRankingQueryFn(
  academicPeriodId?: number,
  departmentId?: number,
) {
  return function useTeacherRankingQuery({
    page = 1,
    limit = 10,
    search = "",
    sort = "desc",
  }: {
    page: number;
    limit: number;
    search: string;
    sort: "asc" | "desc";
  }): UseQueryResult<ResponseAPI<TeacherRankingItem[]>> {
    return useGetTeacherRanking(page, limit, search, sort, academicPeriodId, departmentId);
  };
}
