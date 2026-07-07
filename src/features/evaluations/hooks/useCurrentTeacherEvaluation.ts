import { usePeriodsStore } from "@/features/periods";
import { useGetTeacherById } from "@/features/teachers";
import useGetEvaluations from "./useGetEvaluations";

export default function useCurrentTeacherEvaluation(teacherId: number) {
  const { selectedPeriod } = usePeriodsStore();
  const { data: teacherRes } = useGetTeacherById(teacherId);
  const teacher = teacherRes?.data;

  const { data: evaluationsRes } = useGetEvaluations({
    page: 1,
    limit: 1,
    search: "",
    period_id: selectedPeriod?.id ?? "",
    department_id: teacher?.department_id,
    enabled: !!teacher,
  });

  const evaluation = evaluationsRes?.data?.[0];

  return { data: evaluation };
}
