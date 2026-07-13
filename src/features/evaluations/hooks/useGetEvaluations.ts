import { useQuery } from "@tanstack/react-query";

import getEvaluations from "../api/getEvaluations";

export default function useGetEvaluations({
  page = 1,
  limit = 10,
  search = "",
  period_id,
  department_id,
  sort_by,
  enabled: externalEnabled,
}: {
  page: number;
  limit: number;
  search: string;
  period_id?: string;
  department_id?: number;
  sort_by?: string;
  enabled?: boolean;
}) {
  const periodEnabled = period_id !== undefined ? !!period_id : true;
  return useQuery({
    queryKey: [
      "evaluations",
      page,
      limit,
      search,
      period_id,
      department_id,
      sort_by,
    ],
    queryFn: () =>
      getEvaluations({
        page,
        limit,
        search,
        period_id,
        department_id,
        sort_by,
      }),
    enabled: periodEnabled && (externalEnabled ?? true),
  });
}
