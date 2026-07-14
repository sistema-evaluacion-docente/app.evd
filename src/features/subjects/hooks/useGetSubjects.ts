import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import { getSubjects } from "../api/subjectsService";

export default function useGetSubjects() {
  const { user } = useAuth();
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["subjects", selectedPeriod?.id, user?.department_id],
    queryFn: () =>
      getSubjects(
        Number(selectedPeriod!.id),
        user?.department_id ?? undefined,
      ),
    enabled: !!selectedPeriod?.id,
    staleTime: 5 * 60 * 1000,
  });
}
