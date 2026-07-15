import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

import {
  useGetTeacherById,
  useGetTeacherHistory,
  useGetTeacherSemesterComparison,
} from "@/features/teachers";
import type { TeacherSemesterComparisonDimension } from "../types/Teacher";

interface TeacherComparisonContentProps {
  teacherId: number;
}

export default function TeacherComparisonContent({
  teacherId,
}: TeacherComparisonContentProps) {
  const { data: teacherRes, isLoading: teacherLoading } =
    useGetTeacherById(teacherId);
  const teacher = teacherRes?.data;

  const { data: historyRes } = useGetTeacherHistory(teacherId);
  const history = historyRes?.data?.history ?? [];

  const [currentSemester, setCurrentSemester] = useState<string>("");
  const [oldSemester, setOldSemester] = useState<string>("");

  const { data, isLoading } = useGetTeacherSemesterComparison({
    teacher_id: teacherId,
    current_semester: Number(currentSemester),
    old_semester: Number(oldSemester),
  });

  const comparison = data?.data;

  const periodOptions = history.map((h) => ({
    value: String(h.period_id),
    label: `${h.period_name}`,
  }));

  const teacherName =
    teacher?.user?.name ?? comparison?.teacher_name ?? "—";

  if (teacherLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-32 w-full" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="mb-4 space-y-4">
        <Link
          href={`/teachers/${teacherId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft size={18} />
          Volver a Perfil de Docente
        </Link>

        <h2 className="text-2xl font-semibold tracking-tight">
          Comparativa de Desempeño Docente
        </h2>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                {teacherName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>

              <AvatarImage
                src={teacher?.user?.avatar_url ?? ""}
                alt={teacherName}
              />
            </Avatar>

            <div>
              <h3 className="text-lg font-semibold">{teacherName}</h3>

              <p className="text-sm text-muted-foreground">
                Cód. {teacher?.institutional_code ?? "—"}
                {teacher?.contract_type ? ` • ${teacher.contract_type}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-muted-foreground">
                Semestre A (Base)
              </label>

              <Select
                value={oldSemester}
                onValueChange={(value) => {
                  if (value !== null) setOldSemester(value);
                }}
              >
                <SelectTrigger>
                  <span>
                    {!oldSemester ? "Selecciona un periodo" : periodOptions?.find(p => p.value == oldSemester)?.label}
                  </span>
                </SelectTrigger>

                <SelectContent>
                  {periodOptions?.map(period => <SelectItem value={period.value}>
                    {period.label}
                  </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-muted-foreground">
                Semestre B (Actual)
              </label>

              <Select
                value={currentSemester}
                onValueChange={(value) => {
                  if (value !== null) setCurrentSemester(value);
                }}
              >
                <SelectTrigger>
                  <span>
                    {!currentSemester ? "Selecciona un periodo" : periodOptions?.find(p => p.value === currentSemester)?.label}
                  </span>
                </SelectTrigger>

                <SelectContent>
                  {periodOptions?.map(period => <SelectItem value={period.value}>
                    {period.label}
                  </SelectItem>)}
                </SelectContent>
              </Select>

            </div>
          </div>
        </div>
      </Card>

      {!currentSemester || !oldSemester ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Selecciona ambos periodos para comparar.
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>

          <Skeleton className="h-64 w-full" />
        </div>
      ) : comparison ? (
        <>
          <ComparisonKpis comparison={comparison} />
          <DimensionComparisonSection dimensions={comparison.dimensions ?? []} />
          <CourseComparisonSection comparison={comparison} />
          <CommentsComparisonSection comparison={comparison} />
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Sin datos de comparacion para los periodos seleccionados.
        </Card>
      )}
    </div>
  );
}

function ComparisonKpis({
  comparison,
}: {
  comparison: NonNullable<
    ReturnType<typeof useGetTeacherSemesterComparison>["data"]
  >["data"];
}) {
  if (!comparison) return null;

  const avgDelta = comparison.average_difference;
  const participationCurrent = comparison.current_respondent_count;
  const participationOld = comparison.old_respondent_count;
  const participationDelta =
    participationOld > 0
      ? Math.round(
        ((participationCurrent - participationOld) / participationOld) * 100,
      )
      : 0;

  const currentRiskHigh =
    comparison.current_comments?.risk_breakdown?.["PLAN ACTIVO"] ?? 0;
  const oldRiskHigh =
    comparison.old_comments?.risk_breakdown?.["PLAN ACTIVO"] ?? 0;
  const riskDelta =
    oldRiskHigh > 0
      ? Math.round(((currentRiskHigh - oldRiskHigh) / oldRiskHigh) * 100)
      : currentRiskHigh > 0
        ? 100
        : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <KpiCard
        title="Promedio General"
        icon={<Info size={16} />}
        currentValue={comparison.current_overall_average.toFixed(1)}
        oldValue={comparison.old_overall_average.toFixed(1)}
        suffix="Escala 1-5"
        delta={avgDelta}
        deltaPrefix={avgDelta >= 0 ? "+" : ""}
        deltaIsPositive={avgDelta >= 0}
        deltaIsGoodWhenUp
      />

      <KpiCard
        title="Participacion Estudiantil"
        icon={<Users size={16} />}
        currentValue={`${participationCurrent}`}
        oldValue={`${participationOld}`}
        suffix={`${comparison.current_group_count} grupos`}
        delta={participationDelta}
        deltaPrefix={participationDelta >= 0 ? "+" : ""}
        deltaSuffix="%"
        deltaIsPositive={participationDelta >= 0}
        deltaIsGoodWhenUp
      />

      <KpiCard
        title="Comentarios Riesgo Alto"
        icon={<TriangleAlert size={16} />}
        currentValue={String(currentRiskHigh)}
        oldValue={String(oldRiskHigh)}
        suffix="Total de menciones"
        delta={riskDelta}
        deltaPrefix={riskDelta <= 0 ? "" : "+"}
        deltaSuffix="%"
        deltaIsPositive={riskDelta <= 0}
        deltaIsGoodWhenUp={false}
      />
    </div>
  );
}

function KpiCard({
  title,
  icon,
  currentValue,
  oldValue,
  suffix,
  delta,
  deltaPrefix,
  deltaSuffix = "",
  deltaIsPositive,
  deltaIsGoodWhenUp = true,
}: {
  title: string;
  icon: React.ReactNode;
  currentValue: string;
  oldValue: string;
  suffix: string;
  delta: number;
  deltaPrefix: string;
  deltaSuffix?: string;
  deltaIsPositive: boolean;
  deltaIsGoodWhenUp: boolean;
}) {
  const isGood = deltaIsGoodWhenUp ? deltaIsPositive : !deltaIsPositive;

  return (
    <Card className="flex flex-col justify-between p-4">
      <h4 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        <span className="text-muted-foreground/60">{icon}</span>
      </h4>

      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="num text-2xl font-bold tabular-nums text-primary">
              {currentValue}
            </span>

            <span className="text-sm text-muted-foreground line-through opacity-70">
              {oldValue}
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{suffix}</p>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            isGood
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          )}
        >
          {delta > 0.005 ? (
            <TrendingUp size={14} />
          ) : delta < -0.005 ? (
            <TrendingDown size={14} />
          ) : (
            <Minus size={14} />
          )}

          {deltaPrefix}

          {typeof delta === "number" ? Math.abs(delta) : 0}

          {deltaSuffix}
        </div>
      </div>
    </Card>
  );
}

function DimensionComparisonSection({
  dimensions,
}: {
  dimensions: TeacherSemesterComparisonDimension[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (dimensions.length === 0) return null;

  const toggleDimension = (dim: string) => {
    setExpanded((prev) => ({ ...prev, [dim]: !prev[dim] }));
  };

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="mb-4 text-base font-semibold">
        Comparativa por Dimensiones
      </h3>

      <div className="space-y-3">
        {dimensions.map((dim) => {
          const isGood = dim.difference >= 0;
          const isExpanded = expanded[dim.dimension] ?? false;

          return (
            <div key={dim.dimension} className="rounded-lg border">
              <button
                type="button"
                onClick={() => toggleDimension(dim.dimension)}
                className="cursor-pointer flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{dim.dimension}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1 tabular-nums">
                    <span className="text-xs text-muted-foreground">
                      {dim.old_average.toFixed(2)}
                    </span>

                    <span className="text-xs text-muted-foreground">→</span>

                    <span className="text-sm font-semibold">
                      {dim.current_average.toFixed(2)}
                    </span>
                  </div>

                  <DeltaBadge
                    delta={dim.difference}
                    isGood={isGood}
                    suffix=""
                  />

                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && dim.questions?.length > 0 && (
                <div className="border-t px-4 py-3">
                  <ul className="space-y-2">
                    {dim.questions.map((q) => {
                      const qIsGood = q.difference >= 0;
                      return (
                        <li
                          key={q.code}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="max-w-[60%] truncate text-muted-foreground">
                            {q.text}
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-baseline gap-1 tabular-nums">
                              <span className="text-xs text-muted-foreground">
                                {q.old_average.toFixed(2)}
                              </span>

                              <span className="text-xs text-muted-foreground">
                                →
                              </span>

                              <span className="font-medium">
                                {q.current_average.toFixed(2)}
                              </span>
                            </div>

                            <DeltaBadge
                              delta={q.difference}
                              isGood={qIsGood}
                              suffix=""
                              size="sm"
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CourseComparisonSection({
  comparison,
}: {
  comparison: NonNullable<
    ReturnType<typeof useGetTeacherSemesterComparison>["data"]
  >["data"];
}) {
  if (!comparison) return null;

  const currentCourses = comparison.current_courses ?? [];
  const oldCourses = comparison.old_courses ?? [];

  if (currentCourses.length === 0 && oldCourses.length === 0) return null;

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
        <BookOpen size={18} />
        Comparativa por Materias
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CourseColumn
          title={`Semestre B — ${comparison.current_semester}`}
          courses={currentCourses}
          groups={comparison.current_group_count}
          respondents={comparison.current_respondent_count}
        />

        <CourseColumn
          title={`Semestre A — ${comparison.old_semester}`}
          courses={oldCourses}
          groups={comparison.old_group_count}
          respondents={comparison.old_respondent_count}
        />
      </div>
    </Card>
  );
}

function CourseColumn({
  title,
  courses,
  groups,
  respondents,
}: {
  title: string;
  courses: {
    course_code: string;
    course_name: string;
    group_name: string;
    overall_average: number;
    respondent_count: number;
  }[];
  groups: number;
  respondents: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>

        <span className="text-xs text-muted-foreground">
          {groups} grupos · {respondents} respuestas
        </span>
      </div>

      <ul className="divide-y rounded-lg border">
        {courses.map((course) => (
          <li
            key={`${course.course_code}-${course.group_name}`}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {course.course_name}
              </span>

              <span className="block text-xs text-muted-foreground">
                Grupo {course.group_name} · {course.respondent_count}{" "}
                respuestas
              </span>
            </div>

            <span className="num text-sm font-semibold tabular-nums">
              {course.overall_average.toFixed(2)}
            </span>
          </li>
        ))}

        {courses.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin materias registradas
          </li>
        )}
      </ul>
    </div>
  );
}

function CommentsComparisonSection({
  comparison,
}: {
  comparison: NonNullable<
    ReturnType<typeof useGetTeacherSemesterComparison>["data"]
  >["data"];
}) {
  if (!comparison) return null;

  const currentComments = comparison.current_comments;
  const oldComments = comparison.old_comments;

  if (!currentComments && !oldComments) return null;

  const allRiskKeys = new Set([
    ...Object.keys(currentComments?.risk_breakdown ?? {}),
    ...Object.keys(oldComments?.risk_breakdown ?? {}),
  ]);

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
        <Award size={18} />
        Resumen de Comentarios
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommentColumn
          title={`Semestre B — ${comparison.current_semester}`}
          totalComments={currentComments?.total_comments ?? 0}
          riskBreakdown={currentComments?.risk_breakdown ?? {}}
          riskKeys={Array.from(allRiskKeys)}
        />

        <CommentColumn
          title={`Semestre A — ${comparison.old_semester}`}
          totalComments={oldComments?.total_comments ?? 0}
          riskBreakdown={oldComments?.risk_breakdown ?? {}}
          riskKeys={Array.from(allRiskKeys)}
        />
      </div>
    </Card>
  );
}

function CommentColumn({
  title,
  totalComments,
  riskBreakdown,
  riskKeys,
}: {
  title: string;
  totalComments: number;
  riskBreakdown: Record<string, number>;
  riskKeys: string[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>

        <span className="text-xs text-muted-foreground">
          {totalComments} comentarios
        </span>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        {riskKeys.map((key) => {
          const count = riskBreakdown[key] ?? 0;
          const barColor =
            key === "PLAN ACTIVO"
              ? "bg-red-500"
              : key === "SEGUIMIENTO"
                ? "bg-amber-500"
                : "bg-emerald-500";

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-28 text-xs font-medium text-muted-foreground">
                {key}
              </span>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", barColor)}
                  style={{
                    width: totalComments > 0 ? `${(count / totalComments) * 100}%` : "0%",
                  }}
                />
              </div>

              <span className="num w-8 text-right text-xs font-semibold tabular-nums">
                {count}
              </span>
            </div>
          );
        })}

        {riskKeys.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Sin datos de riesgo
          </p>
        )}
      </div>
    </div>
  );
}

function DeltaBadge({
  delta,
  isGood,
  suffix = "",
  size = "default",
}: {
  delta: number;
  isGood: boolean;
  suffix?: string;
  size?: "default" | "sm";
}) {
  const Icon =
    delta > 0.005 ? ArrowUp : delta < -0.005 ? ArrowDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        isGood
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      )}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {delta >= 0 ? "+" : ""}
      {delta.toFixed(2)}
      {suffix}
    </span>
  );
}
