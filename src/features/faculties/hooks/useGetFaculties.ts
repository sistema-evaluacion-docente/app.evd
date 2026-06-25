import { useQuery } from "@tanstack/react-query";
import getFaculties from "../api/getFaculties";

export default function useGetFaculties() {
  return useQuery({
    queryKey: ["faculties"],
    queryFn: getFaculties,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
