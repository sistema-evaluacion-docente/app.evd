import { useQuery } from "@tanstack/react-query";

import getTeachers from "../api/getTeachers";

export default function useGetTeachers({
  page = 1,
  limit = 10,
  search = "",
  academic_period_id,
}: {
  page: number;
  limit: number;
  search: string;
  academic_period_id?: string;
}) {
  return useQuery({
    queryKey: ["teachers", page, limit, search, academic_period_id],
    queryFn: () =>
      getTeachers({
        page,
        limit,
        search,
        academic_period_id: academic_period_id
          ? Number(academic_period_id)
          : undefined,
      }),
  });
}
