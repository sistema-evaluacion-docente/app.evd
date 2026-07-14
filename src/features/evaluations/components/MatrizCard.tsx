import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

import type { EvaluationRecord } from "@/features/evaluations";
import { useGetTeacherMatrix } from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";

interface MatrizCardProps {
  teacherId: number;
  evaluation?: EvaluationRecord;
}

const QUESTION_CODES = Array.from({ length: 22 }, (_, i) =>
  String(i + 1).padStart(3, "0"),
);

function scoreColor(score: number): string {
  if (score >= 4.5) return "text-emerald-600";
  if (score >= 4.0) return "text-green-600";
  if (score >= 3.5) return "text-lime-600";
  if (score >= 3.0) return "text-yellow-600";
  if (score >= 2.5) return "text-orange-600";

  return "text-red-600";
}

export default function MatrizCard({ teacherId, evaluation }: MatrizCardProps) {
  const { selectedPeriod } = usePeriodsStore();

  const { data, isLoading, isFetched } = useGetTeacherMatrix(
    teacherId,
    evaluation?.id,
  );

  const matrix = data?.data;

  if (isLoading || !isFetched) {
    return (
      <Card className="p-5 sm:p-6 animate-fade-in">
        <Skeleton className="mb-5 h-6 w-52" />

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6 animate-fade-in">
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-lg font-semibold">Matriz de Evaluacion</h2>
        <Info size={15} className="text-muted-foreground" />
      </div>

      {!matrix?.courses.length ? (
        <p className="text-muted-foreground">
          {selectedPeriod
            ? "Sin datos de evaluacion para este periodo."
            : "Selecciona un periodo academico."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-semibold">
                  Materia
                </th>

                {QUESTION_CODES.map((code) => (
                  <th
                    key={code}
                    className="px-2 py-2 text-center font-medium text-muted-foreground"
                  >
                    {code}
                  </th>
                ))}

                <th className="px-3 py-2 text-center font-semibold">
                  Promedio
                </th>
              </tr>
            </thead>

            <tbody>
              {matrix.courses.map((course) => (
                <tr
                  key={course.course_name}
                  className="border-b hover:bg-muted/50"
                >
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-background px-3 py-2 font-medium">
                    {course.course_name}
                  </td>

                  {QUESTION_CODES.map((code) => {
                    const val = course.question_averages[code];
                    return (
                      <td
                        key={code}
                        className={`px-2 py-2 text-center tabular-nums ${val != null ? scoreColor(val) : "text-muted-foreground"}`}
                      >
                        {val != null ? val.toFixed(2) : "-"}
                      </td>
                    );
                  })}

                  <td className="px-3 py-2 text-center font-semibold tabular-nums">
                    {course.overall_average.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/60 font-semibold">
                <td className="sticky left-0 z-10 bg-muted px-3 py-2">
                  Promedio
                </td>

                {QUESTION_CODES.map((code) => {
                  const val = matrix.column_averages[code];
                  return (
                    <td
                      key={code}
                      className={`px-2 py-2 text-center tabular-nums ${val != null ? scoreColor(val) : "text-muted-foreground"}`}
                    >
                      {val != null ? val.toFixed(2) : "-"}
                    </td>
                  );
                })}

                <td className="px-3 py-2 text-center tabular-nums">
                  {matrix.column_averages &&
                    (
                      Object.values(matrix.column_averages).reduce(
                        (a, b) => a + b,
                        0,
                      ) / Object.values(matrix.column_averages).length
                    ).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
