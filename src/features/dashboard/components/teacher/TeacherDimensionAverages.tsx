import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareText } from "lucide-react";

import { Link } from "wouter";
import type { TeacherDimensionAverageItem } from "../../api/getTeacherDimensionAverages";
import useGetTeacherDimensionAverages from "../../hooks/useGetTeacherDimensionAverages";

function TeacherDimensionAverages() {
  const { data, isLoading, isFetched } = useGetTeacherDimensionAverages();

  const dimensions: TeacherDimensionAverageItem[] =
    data?.data?.dimensions ?? [];

  if (isLoading || !isFetched) {
    return (
      <Card>
        <CardContent>
          <div className="mb-5 flex items-start justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-4" />
          </div>

          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="mt-2 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0 animate-fade-in">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText size={16} className="text-ink-500" />

          <div>
            <CardTitle>Promedio por Dimensión</CardTitle>
          </div>
        </div>

        <Link
          href={`/matrix`}
          className="text-xs text-muted-foreground underline"
        >
          Ver detalle
        </Link>
      </CardHeader>

      <CardContent>
        <ul className="space-y-5">
          {dimensions.map((dimension) => (
            <li key={dimension.dimension}>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-700">
                <span>{dimension.dimension}</span>

                <span className="num tabular-nums text-ink-900">
                  {dimension.percentage != null
                    ? `${dimension.percentage}%`
                    : "N/A"}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full bg-ink-800 transition-all duration-700"
                  style={{
                    width: `${dimension.percentage ?? 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default TeacherDimensionAverages;
