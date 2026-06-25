import { useQuery } from "@tanstack/react-query";
import getDepartments from "../api/getDepartments";

export default function useGetDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
