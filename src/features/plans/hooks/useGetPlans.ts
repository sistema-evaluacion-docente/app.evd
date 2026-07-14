import { useQuery } from "@tanstack/react-query";
import getPlans, { type GetPlansParams } from "../api/getPlans";

export default function useGetPlans(params: GetPlansParams) {
  return useQuery({
    queryKey: ["plans", params],
    queryFn: () => getPlans(params),
    staleTime: 60 * 1000,
  });
}
