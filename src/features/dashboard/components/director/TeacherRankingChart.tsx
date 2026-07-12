import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";

import type { TeacherRankItem } from "../../api/getTeacherPerformance";

interface TeacherRankingChartProps {
  title: string;
  subtitle: string;
  teachers: TeacherRankItem[];
  barColor: string;
  barBg: string;
  scoreColor: string;
  icon: LucideIcon;
  maxScore?: number;
  isLoading?: boolean;
  evaluationId?: number;
}

function TeacherRankingChart({
  title,
  subtitle,
  teachers,
  scoreColor,
  icon: Icon,
  isLoading = false,
  evaluationId,
}: TeacherRankingChartProps) {
  if (isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                </div>

                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Icon size={16} className="text-muted-foreground" />

            <div>
              <h3 className="text-base font-semibold">{title}</h3>

              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>

          <Link
            href={`/evaluations/${evaluationId}`}
            className="text-xs text-muted-foreground underline"
          >
            Ver todos
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {teachers.map((teacher, index) => {
            return (
              <Link
                key={teacher.teacher_id}
                className="block transition-opacity hover:opacity-80"
                to={`/teachers/${teacher.teacher_id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {teacher.name ? teacher.name[0] : index + 1}
                      </AvatarFallback>

                      <AvatarImage src={teacher.avatar_url ?? undefined} />
                    </Avatar>

                    <div>
                      <p className="text-sm font-medium">
                        {teacher.name}
                      </p>
                    </div>
                  </div>

                  <span className={`text-sm font-semibold ${scoreColor}`}>
                    {teacher.overall_average?.toFixed(2) ?? "N/A"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default TeacherRankingChart;
