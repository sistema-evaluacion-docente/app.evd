import { useQuery } from "@tanstack/react-query";
import getTeacherSemesterComparison from "../api/getTeacherSemesterComparison";

export default function useGetTeacherSemesterComparison({
  teacher_id,
  current_semester,
  old_semester,
}: {
  teacher_id: number;
  current_semester: number;
  old_semester: number;
}) {
  return useQuery({
    queryKey: [
      "teacher-semester-comparison",
      teacher_id,
      current_semester,
      old_semester,
    ],
    queryFn: () =>
      getTeacherSemesterComparison({
        teacher_id,
        current_semester,
        old_semester,
      }),
    enabled: !!teacher_id && !!current_semester && !!old_semester,
  });
}
