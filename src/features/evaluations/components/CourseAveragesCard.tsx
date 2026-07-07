import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

import type { EvaluationRecord } from "@/features/evaluations";
import { useGetTeacherEvaluationDetail } from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";

interface CourseAveragesCardProps {
  teacherId: number;
  evaluation?: EvaluationRecord;
}

export default function CourseAveragesCard({
  teacherId,
  evaluation,
}: CourseAveragesCardProps) {
  const { selectedPeriod } = usePeriodsStore();

  const { data, isLoading, isFetched } = useGetTeacherEvaluationDetail(
    evaluation?.id,
    teacherId,
  );

  const detail = data?.data;

  if (isLoading || !isFetched) {
    return (
      <Card className="h-full p-5 sm:p-6 animate-fade-in">
        <Skeleton className="mb-5 h-6 w-44" />

        <ul>
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center justify-between py-3.5">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-6 w-14" />
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <Card className="h-full p-5 sm:p-6 animate-fade-in">
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-[17px] font-semibold text-ink-900">
          Promedio por Materia
        </h2>

        <Info size={15} className="text-ink-400" />
      </div>

      {!detail?.courses.length ? (
        <p className="text-[13px] text-ink-400">
          {selectedPeriod
            ? "Sin materias registradas para este periodo."
            : "Selecciona un periodo académico."}
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {detail.courses.map((course) => (
            <li
              key={`${course.course_code}-${course.group_name}`}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-ink-800">
                  {course.course_name}
                </p>

                <p className="mt-0.5 text-[12px] text-ink-400">
                  {course.group_name} · {course.respondent_count} encuestado
                  {course.respondent_count !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-baseline gap-0.5 tabular-nums">
                <span className="num text-[22px] font-semibold text-ink-900">
                  {course.overall_average}
                </span>

                <span className="text-[12px] font-medium text-ink-400">
                  /5.0
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
