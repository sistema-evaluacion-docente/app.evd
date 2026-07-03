import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

import { Link } from "wouter";
import type { TeacherCourseItem } from "../../api/getTeacherCourses";
import useGetTeacherCourses from "../../hooks/useGetTeacherCourses";

function TeacherCoursesChart() {
  const { data, isLoading, isFetched } = useGetTeacherCourses();

  const courses: TeacherCourseItem[] = data?.data ?? [];

  if (isLoading || !isFetched) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>

                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <CardTitle>Mis Asignaturas</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-ink-400">Sin datos disponibles</p>
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
            <CardTitle>Mis Asignaturas</CardTitle>
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
        <div className="space-y-3">
          {courses.map((course) => (
            <Link
              to={`/matrix?course_code=${course.course_code}&group_name=${course.group_name ?? ""}`}
              key={course.course_code + (course.group_name ?? "")}
              className="block transition-opacity hover:opacity-80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-100 text-brand-700">
                    <BookOpen size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink-800">
                      {course.course_name ?? course.course_code}
                    </p>

                    {course.group_name && (
                      <p className="text-xs text-ink-500">
                        {course.group_name}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-sm font-semibold text-brand-600">
                  {course.overall_average?.toFixed(2) ?? "N/A"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TeacherCoursesChart;
