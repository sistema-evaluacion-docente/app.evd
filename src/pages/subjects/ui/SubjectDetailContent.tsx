import { cn } from "@/lib/utils";
import { useGetSubjectTeachers } from "@/features/subjects";
import { ScoreBarInline } from "@/features/evaluations";
import { StatTile } from "@/shared/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Info,
  Minus,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

function scoreTextColor(score: number) {
  if (score >= 4.0) return "text-emerald-600";
  if (score >= 3.5) return "text-amber-600";
  return "text-red-600";
}

function scoreBarColor(score: number) {
  if (score >= 4.0) return "bg-emerald-500";
  if (score >= 3.5) return "bg-amber-500";
  return "bg-red-500";
}

function getDetailDiagnosis(
  avg: number,
  gap: number,
  allTeachersLow: boolean,
): { variant: "alert" | "warn" | "ok" | "neutral"; text: string } {
  if (allTeachersLow && avg < 3.5)
    return {
      variant: "alert",
      text: "Todos los docentes con promedio bajo — posible problema estructural de la materia",
    };
  if (gap > 0.9)
    return {
      variant: "warn",
      text: "Alta variación entre docentes — revisar metodologías individualmente",
    };
  if (avg >= 4.0)
    return {
      variant: "ok",
      text: "Materia bien evaluada de forma consistente",
    };
  return {
    variant: "neutral",
    text: "Rendimiento moderado — monitorear en próximo período",
  };
}

type Props = { courseId: number };

function SubjectDetailContent({ courseId }: Props) {
  const { data, isLoading } = useGetSubjectTeachers(courseId);

  const subject = data?.data;
  const teachers = subject?.teachers ?? [];

  const courseAverage = useMemo(() => {
    if (!teachers.length) return 0;
    return (
      teachers.reduce((a, t) => a + t.overall_average, 0) / teachers.length
    );
  }, [teachers]);

  const gap = useMemo(() => {
    if (teachers.length < 2) return 0;
    const scores = teachers.map((t) => t.overall_average);
    return Math.max(...scores) - Math.min(...scores);
  }, [teachers]);

  const allTeachersLow = teachers.every((t) => t.overall_average < 3.8);
  const diagnosis = getDetailDiagnosis(courseAverage, gap, allTeachersLow);

  const sortedTeachers = useMemo(
    () => [...teachers].sort((a, b) => b.overall_average - a.overall_average),
    [teachers],
  );

  const dimensionAverages = useMemo(() => {
    if (!teachers.length) return [];
    const map: Record<string, number[]> = {};
    teachers.forEach((t) => {
      t.dimensions.forEach((d) => {
        if (!map[d.dimension]) map[d.dimension] = [];
        map[d.dimension].push(d.average);
      });
    });
    return Object.entries(map)
      .map(([dimension, values]) => ({
        dimension,
        average: values.reduce((a, b) => a + b, 0) / values.length,
      }))
      .sort((a, b) => a.average - b.average);
  }, [teachers]);

  const diagnosisStyles = {
    alert: "border-red-200 bg-red-50 text-red-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-ink-200 bg-ink-50 text-ink-500",
  };

  if (isLoading) {
    return (
      <>
        <div className="h-4 w-24 animate-pulse rounded bg-ink-100" />
        <div className="h-28 animate-pulse rounded-lg bg-ink-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      </>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center text-ink-400">
        <Info size={28} className="opacity-40" />
        <p className="text-[13px]">No se encontró información de la materia.</p>
        <Link href="/subjects" className="text-[13px] text-brand-600 hover:underline">
          Volver a materias
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-500">
        <Link
          href="/subjects"
          className="flex items-center gap-1 hover:text-ink-800"
        >
          <ArrowLeft size={13} />
          Materias
        </Link>
        <span className="text-ink-300">/</span>
        <span className="font-medium text-ink-800">{subject.course_name}</span>
      </nav>

      {/* Hero */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[12px] font-medium text-ink-400">
              {subject.course_code}
            </p>
            <h1 className="mt-1 text-[22px] font-semibold leading-tight text-ink-900">
              {subject.course_name}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-400">
              Período: {subject.academic_period_code}
            </p>
          </div>

          <div
            className={cn(
              "max-w-xs shrink-0 rounded-md border p-3",
              diagnosisStyles[diagnosis.variant],
            )}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">
              Diagnóstico
            </p>
            <p className="text-[13px] leading-snug">{diagnosis.text}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatTile
            label="Promedio materia"
            value={
              <span className={scoreTextColor(courseAverage)}>
                {courseAverage.toFixed(2)}
              </span>
            }
            sub="/5.0"
            icon={<Info size={16} className={scoreTextColor(courseAverage)} />}
          />
        </div>
        <StatTile
          label="Docentes"
          value={teachers.length}
          icon={<Users size={16} className="text-brand-600" />}
        />
        <StatTile
          label="Grupos"
          value={teachers.reduce((a, t) => a + t.group_count, 0)}
          icon={<Info size={16} className="text-ink-400" />}
        />
        <StatTile
          label="Brecha docentes"
          value={
            <span
              className={
                gap > 0.9
                  ? "text-red-600"
                  : gap > 0.5
                    ? "text-amber-600"
                    : "text-emerald-600"
              }
            >
              {gap.toFixed(2)}
            </span>
          }
          sub="máx − mín"
          icon={
            gap > 0.9 ? (
              <ArrowDown size={16} className="text-red-500" />
            ) : (
              <Minus size={16} className="text-emerald-500" />
            )
          }
        />
        <StatTile
          label="Tendencia"
          value="—"
          sub="vs período ant."
          icon={<ArrowUp size={16} className="text-ink-300" />}
        />
      </div>

      {/* Teacher comparison */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-sm">
        <p className="mb-4 border-b border-ink-100 pb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Comparación de docentes en esta materia
        </p>

        {sortedTeachers.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-400">
            Sin docentes registrados
          </p>
        ) : (
          <div className="space-y-0 divide-y divide-ink-100">
            {sortedTeachers.map((teacher, i) => {
              const vs = teacher.overall_average - courseAverage;
              return (
                <div
                  key={teacher.teacher_id}
                  className="flex items-center gap-4 py-3"
                >
                  {/* Avatar + Name */}
                  <div className="flex w-50 shrink-0 items-center gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={teacher.avatar_url ?? ""}
                        alt={teacher.name ?? ""}
                      />
                      <AvatarFallback className="text-[11px]">
                        {(teacher.name ?? "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <Link
                        href={`/teachers/${teacher.teacher_id}`}
                        className="block truncate text-[13px] font-medium text-ink-800 hover:text-brand-600"
                      >
                        {i === 0 && (
                          <span className="mr-1 text-amber-500">★</span>
                        )}
                        {teacher.name ?? "—"}
                      </Link>
                      <p className="text-[11px] text-ink-400">
                        {teacher.group_count} grupo
                        {teacher.group_count !== 1 ? "s" : ""} ·{" "}
                        {teacher.contract_type ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          scoreBarColor(teacher.overall_average),
                        )}
                        style={{
                          width: `${(teacher.overall_average / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Score + delta */}
                  <div className="flex w-27.5 shrink-0 flex-col items-end gap-0.5">
                    <ScoreBarInline score={teacher.overall_average} />
                    <span
                      className={cn(
                        "text-[11px] tabular-nums",
                        Math.abs(vs) <= 0.05
                          ? "text-ink-400"
                          : vs > 0
                            ? "text-emerald-600"
                            : "text-red-600",
                      )}
                    >
                      {Math.abs(vs) <= 0.05
                        ? "≈ Promedio materia"
                        : vs > 0
                          ? `+${vs.toFixed(2)} vs materia`
                          : `${vs.toFixed(2)} vs materia`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dimension averages */}
      {dimensionAverages.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-sm">
          <p className="mb-4 border-b border-ink-100 pb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Promedio por dimensión
          </p>

          <div className="space-y-0 divide-y divide-ink-100">
            {dimensionAverages.map((dim, i) => {
              const isWeakest = i === 0;
              return (
                <div key={dim.dimension} className="flex items-center gap-3 py-3">
                  <p
                    className={cn(
                      "w-50 shrink-0 text-[13px]",
                      isWeakest
                        ? "font-medium text-red-600"
                        : "text-ink-600",
                    )}
                  >
                    {dim.dimension}
                    {isWeakest && (
                      <span className="ml-2 rounded bg-red-50 px-1 py-0.5 text-[10px] font-semibold text-red-600">
                        Débil
                      </span>
                    )}
                  </p>

                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex-1 overflow-hidden rounded-full bg-ink-100 h-1.5">
                      <div
                        className={cn("h-full rounded-full", scoreBarColor(dim.average))}
                        style={{ width: `${(dim.average / 5) * 100}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-10 text-right text-[13px] font-semibold tabular-nums",
                        scoreTextColor(dim.average),
                      )}
                    >
                      {dim.average.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default SubjectDetailContent;
