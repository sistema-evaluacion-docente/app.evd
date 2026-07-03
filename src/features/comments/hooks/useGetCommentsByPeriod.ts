import { useQuery } from "@tanstack/react-query";

import getCommentsByPeriod from "../api/getCommentsByPeriod";

export default function useGetCommentsByPeriod({
  periodId,
  page = 1,
  limit = 10,
  search = "",
  riskLevel = null,
}: {
  periodId: number;
  page: number;
  limit: number;
  search: string;
  riskLevel: number | null;
}) {
  return useQuery({
    queryKey: ["comments-by-period", periodId, page, limit, search],
    queryFn: () =>
      getCommentsByPeriod({
        periodId,
        page,
        limit,
        search,
        riskLevel,
      }),
    enabled: !!periodId,
  });
}
