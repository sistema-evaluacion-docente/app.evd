import { useQuery } from "@tanstack/react-query";

import getTeachersByPeriod from "../api/getTeachersByPeriod";

export default function useGetTeachersByPeriod({
  periodId,
  page = 1,
  limit = 10,
  search = "",
}: {
  periodId: number;
  page: number;
  limit: number;
  search: string;
}) {
  return useQuery({
    queryKey: ["teachers-by-period", periodId, page, limit, search],
    queryFn: () => getTeachersByPeriod({ periodId, page, limit, search }),
    enabled: !!periodId,
  });
}
