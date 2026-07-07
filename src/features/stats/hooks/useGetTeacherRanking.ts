import { useQuery } from "@tanstack/react-query";
import { getTeacherRanking } from "../api/statsService";

export default function useGetTeacherRanking(
  page: number,
  limit: number,
  search: string,
  sort: "asc" | "desc",
  academicPeriodId?: number,
  departmentId?: number,
) {
  return useQuery({
    queryKey: ["teacher-ranking", page, limit, search, sort, academicPeriodId, departmentId],
    queryFn: () => getTeacherRanking(page, limit, search, sort, academicPeriodId, departmentId),
    staleTime: 5 * 60 * 1000,
  });
}
