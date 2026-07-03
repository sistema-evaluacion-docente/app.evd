import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import getEvaluationCount from "../api/getEvaluationCount";

export default function useGetEvaluationCount() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["evaluation-count", selectedPeriod?.id],
    queryFn: () => {
      if (!selectedPeriod?.id) throw new Error("No period selected");

      return getEvaluationCount(selectedPeriod.id);
    },
    enabled: !!selectedPeriod?.id,
  });
}
