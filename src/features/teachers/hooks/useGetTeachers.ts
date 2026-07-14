import { useQuery } from "@tanstack/react-query";

import getTeachers from "../api/getTeachers";

export default function useGetTeachers({
  page = 1,
  limit = 10,
  search = "",
  academic_period_id,
  active,
}: {
  page: number;
  limit: number;
  search: string;
  academic_period_id?: string;
  active?: string;
}) {
  return useQuery({
    queryKey: ["teachers", page, limit, search, academic_period_id, active],
    queryFn: () =>
      getTeachers({
        page,
        limit,
        search,
        academic_period_id: academic_period_id
          ? Number(academic_period_id)
          : undefined,
        active: active !== undefined ? active === "true" : undefined,
      }),
  });
}
