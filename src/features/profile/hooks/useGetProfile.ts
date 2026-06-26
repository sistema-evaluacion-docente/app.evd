import { useQuery } from "@tanstack/react-query";
import getProfile from "../api/getProfile";

export default function useGetProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
