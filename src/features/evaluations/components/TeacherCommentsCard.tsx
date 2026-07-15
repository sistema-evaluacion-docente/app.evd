import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

import type { EvaluationRecord } from "@/features/evaluations";
import { useGetTeacherComments } from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";

interface TeacherCommentsCardProps {
  teacherId: number;
  evaluation?: EvaluationRecord;
}

export default function TeacherCommentsCard({
  teacherId,
  evaluation,
}: TeacherCommentsCardProps) {
  const { selectedPeriod } = usePeriodsStore();
  const [activeCommentCourse, setActiveCommentCourse] = useState<
    string | "todas"
  >("todas");

  const { data: commentsRes } = useGetTeacherComments(
    evaluation?.id,
    teacherId,
  );
  const commentCourses = commentsRes?.data?.courses ?? [];

  const courseKey = (c: { course_code: string; group_name: string }) =>
    `${c.course_code}-${c.group_name}`;

  const selectedCommentCourse =
    activeCommentCourse === "todas"
      ? null
      : (commentCourses.find((c) => courseKey(c) === activeCommentCourse) ??
        null);

  const displayComments =
    selectedCommentCourse?.comments ??
    commentCourses.flatMap((c) => c.comments);

  const totalCommentCount = commentCourses.reduce(
    (acc, c) => acc + c.comments.length,
    0,
  );

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Comentarios Detallados</h2>

          <p className="mt-1 text-muted-foreground">
            Comentarios de estudiantes registrados en la evaluación del periodo.
          </p>
        </div>

        {totalCommentCount > 0 && (
          <span className="font-medium text-muted-foreground">
            {displayComments.length}
            {activeCommentCourse !== "todas" && ` de ${totalCommentCount}`}{" "}
            comentario
            {totalCommentCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {commentCourses.length > 0 && (
        <div className="border-b px-5 pb-3 sm:px-6">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCommentCourse("todas")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
                activeCommentCourse === "todas"
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              Todas las materias
            </button>

            {commentCourses.map((course) => {
              const key = courseKey(course);
              const isActive = activeCommentCourse === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCommentCourse(key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {course.course_name}

                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-semibold",
                      isActive
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {course.comments.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {displayComments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <MessageSquare size={28} className="text-muted-foreground" />

          <p className="text-muted-foreground">
            {activeCommentCourse !== "todas"
              ? "Esta materia no obtuvo comentarios en esta evaluación docente."
              : selectedPeriod
                ? "No hay comentarios registrados para este docente en el periodo seleccionado."
                : "Selecciona un periodo académico para ver los comentarios."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
                  Comentario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Nivel de riesgo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Categoría pedagógica
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayComments.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 sm:px-6">
                    <p
                      className="max-w-xl leading-relaxed text-foreground"
                      style={{ textWrap: "pretty" } as React.CSSProperties}
                    >
                      <span className="text-muted-foreground">&ldquo;</span>
                      {item.original_text}
                      <span className="text-muted-foreground">&rdquo;</span>
                    </p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.risk_level ? (
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="inline-flex w-full justify-center items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white whitespace-nowrap"
                          style={{ backgroundColor: item.risk_level.color_hex }}
                        >
                          {item.risk_level.name}
                        </span>
                        {item.risk_score != null && (
                          <span className="text-xs font-medium text-muted-foreground justify-center">
                            {(item.risk_score! * 100).toFixed(1)}% confianza
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.pedagogical_category ? (
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="inline-flex w-full justify-center items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white whitespace-nowrap"
                          style={{ backgroundColor: item.pedagogical_category.color_hex }}
                        >
                          {item.pedagogical_category.name}
                        </span>
                        {item.category_score != null && (
                          <span className="text-[11px] text-muted-foreground">
                            {(item.category_score * 100).toFixed(1)}% confianza
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
