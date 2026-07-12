import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import getDepartmentAverage from "../api/getDepartmentAverage";

export default function useGetDepartmentAverage() {
  const { user } = useAuth();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const departmentId = user?.department_id;

  return useQuery({
    queryKey: ["department-average", departmentId, selectedPeriod?.id],
    queryFn: () =>
      getDepartmentAverage(Number(departmentId), Number(selectedPeriod?.id)),
    enabled: !!departmentId && !!selectedPeriod?.id,
  });
}
