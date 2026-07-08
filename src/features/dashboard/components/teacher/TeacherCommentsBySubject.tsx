import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

import { Link } from "wouter";
import type { TeacherCommentSubjectItem } from "../../api/getTeacherCommentsBySubject";
import useGetTeacherCommentsBySubject from "../../hooks/useGetTeacherCommentsBySubject";

function TeacherCommentsBySubject() {
  const { data, isLoading, isFetched } = useGetTeacherCommentsBySubject();

  const subjects: TeacherCommentSubjectItem[] = data?.data?.subjects ?? [];

  if (isLoading || !isFetched) {
    return (
      <Card>
        <CardContent>
          <div className="mb-1 flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-48" />
          </div>

          <Skeleton className="mb-4 h-4 w-40" />

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-4 h-9 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0 animate-fade-in">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-ink-500" />

          <div>
            <CardTitle>Comentarios por Asignatura</CardTitle>
          </div>
        </div>

        <Link
          href={`/matrix`}
          className="text-xs text-muted-foreground underline"
        >
          Ver todas
        </Link>
      </CardHeader>

      <CardContent>
        <ul>
          {subjects.map((subject) => (
            <li
              key={subject.course_code}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                <div className="">
                  {subject.course_name ?? subject.course_code}
                </div>
              </div>

              <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-50 px-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-brand-700">
                <span className="num tabular-nums">
                  {subject.comment_count}
                </span>{" "}
                comentarios
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default TeacherCommentsBySubject;
