import { useQuery } from "@tanstack/react-query";

import getTeachers from "../api/getTeachers";

export default function useGetTeachers({
  page = 1,
  limit = 10,
  search = "",
}: {
  page: number;
  limit: number;
  search: string;
}) {
  return useQuery({
    queryKey: ["teachers", page, limit, search],
    queryFn: () => getTeachers({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
