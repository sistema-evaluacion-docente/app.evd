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
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-[20px] font-semibold text-ink-900">
            Comentarios Detallados
          </h2>

          <p className="mt-1 text-[13px] text-ink-500">
            Comentarios de estudiantes registrados en la evaluación del periodo.
          </p>
        </div>

        {totalCommentCount > 0 && (
          <span className="text-[13px] font-medium text-ink-500">
            {displayComments.length}
            {activeCommentCourse !== "todas" && ` de ${totalCommentCount}`}{" "}
            comentario
            {totalCommentCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {commentCourses.length > 0 && (
        <div className="border-b border-ink-100 px-5 pb-3 sm:px-6">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCommentCourse("todas")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors",
                activeCommentCourse === "todas"
                  ? "bg-ink-900 text-white"
                  : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
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
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors",
                    isActive
                      ? "bg-ink-900 text-white"
                      : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                  )}
                >
                  {course.course_name}

                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-ink-100 text-ink-500",
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
          <MessageSquare size={28} className="text-ink-300" />

          <p className="text-[13px] text-ink-500">
            {activeCommentCourse !== "todas"
              ? "Esta materia no obtuvo comentarios en esta evaluación docente."
              : selectedPeriod
                ? "No hay comentarios registrados para este docente en el periodo seleccionado."
                : "Selecciona un periodo académico para ver los comentarios."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {displayComments.map((text, i) => (
            <li key={i} className="px-5 py-4 sm:px-6">
              <p
                className="max-w-180 text-[13.5px] leading-relaxed text-ink-800"
                style={{ textWrap: "pretty" }}
              >
                <span className="text-ink-400">"</span>

                {text}

                <span className="text-ink-400">"</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
