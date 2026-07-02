import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  FileText,
  Info,
  Mail,
  MessageSquare,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";

import { useGetTeacherById, useGetTeacherHistory } from "@/features/teachers";
import {
  useGetEvaluations,
  useGetTeacherEvaluationDetail,
  useGetTeacherComments,
} from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";
import { cn } from "@/shared/lib/utils";
import {
  AppFooter,
  AreaChart,
  Avatar,
  Button,
  Card,
  Separator,
} from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

const PLAN_STEPS = [
  {
    key: "inicio",
    label: "Inicio",
    sub: "Feb 15, 2024",
    state: "done" as const,
  },
  {
    key: "medio",
    label: "Mitad de Semestre",
    sub: "Abr 20, 2024",
    state: "current" as const,
  },
  {
    key: "final",
    label: "Final de Semestre",
    sub: "Jun 30, 2024",
    state: "pending" as const,
  },
];

const PLAN_GOALS = [
  { title: "Meta 1: Actualización de Syllabus", progress: 100, done: true },
  {
    title: "Meta 2: Formación en Herramientas Digitales",
    progress: 45,
    done: false,
  },
];

function StepIcon({ state }: { state: "done" | "current" | "pending" }) {
  if (state === "done") {
    return (
      <div className='inline-flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-white'>
        <Check size={20} strokeWidth={2.4} />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div className='inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white ring-4 ring-brand-100'>
        <TrendingUp size={20} />
      </div>
    );
  }
  return (
    <div className='inline-flex h-11 w-11 items-center justify-center rounded-md bg-ink-100 text-ink-400'>
      <Clock size={18} />
    </div>
  );
}

function getRiskLevel(avg: number) {
  if (avg >= 4.0)
    return {
      label: "NORMAL",
      className: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    };
  if (avg >= 3.5)
    return {
      label: "SEGUIMIENTO",
      className: "border-amber-200/70 bg-amber-50 text-amber-700",
    };
  return {
    label: "PLAN ACTIVO",
    className: "border-red-200/70 bg-red-50 text-red-700",
  };
}

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = parseInt(id ?? "0", 10);
  const { selectedPeriod } = usePeriodsStore();
  const [activeCommentCourse, setActiveCommentCourse] = useState<string | "todas">("todas");

  const { data: teacherRes, isLoading: teacherLoading } =
    useGetTeacherById(teacherId);
  const teacher = teacherRes?.data;

  const { data: evaluationsRes, isLoading: evaluationsLoading } = useGetEvaluations({
    page: 1,
    limit: 1,
    search: "",
    period_id: selectedPeriod?.id ?? "",
    department_id: teacher?.department_id,
    enabled: !!teacher,
  });
  const evaluation = evaluationsRes?.data?.[0];

  const { data: detailRes, isLoading: detailLoading } =
    useGetTeacherEvaluationDetail(evaluation?.id, teacherId);
  const detail = detailRes?.data;

  const isLoading = teacherLoading || evaluationsLoading || detailLoading;
  const noData = !isLoading && !detail;

  const { data: historyRes } = useGetTeacherHistory(teacherId);
  const history = historyRes?.data?.history ?? [];

  const { data: commentsRes } = useGetTeacherComments(evaluation?.id, teacherId);
  const commentCourses = commentsRes?.data?.courses ?? [];

  const courseKey = (c: { course_code: string; group_name: string }) =>
    `${c.course_code}-${c.group_name}`;

  const selectedCommentCourse =
    activeCommentCourse === "todas"
      ? null
      : commentCourses.find((c) => courseKey(c) === activeCommentCourse) ?? null;

  const displayComments =
    selectedCommentCourse?.comments ??
    commentCourses.flatMap((c) => c.comments);

  const totalCommentCount = commentCourses.reduce(
    (acc, c) => acc + c.comments.length,
    0,
  );

  const recurrentLowPerformance = useMemo(() => {
    const last4 = history.slice(-4);
    return last4.length === 4 && last4.every((h) => h.overall_average < 3.5);
  }, [history]);

  const teacherName = detail?.name ?? teacher?.user?.name ?? "—";
  const contractType = detail?.contract_type ?? teacher?.contract_type ?? "—";
  const periodLabel = detail?.period_name ?? selectedPeriod?.name ?? "—";
  const overallAverage = detail?.overall_average ?? 0;
  const risk = getRiskLevel(overallAverage);

  const chartData = history.map((h) => ({
    label: h.period_code,
    value: h.overall_average,
  }));


  return (
    <AppLayout
      header={{
        rightMode: "periodo",
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link
              href='/teachers'
              className='shrink-0 transition-colors hover:text-ink-900'
            >
              Directorio
            </Link>
            <ArrowRight size={12} className='shrink-0 text-ink-300' />
            <span className='truncate font-medium text-ink-900'>
              {teacherName}
            </span>
          </>
        ),
      }}
    >
      {/* Profile header */}
      <Card className='p-5 sm:p-6'>
        {/* Avatar + nombre + metadata — siempre en fila */}
        <div className='flex items-start gap-4'>
          <div className='relative shrink-0'>
            <Avatar
              name={teacherName}
              src={teacher?.user?.avatar_url || undefined}
              size={80}
              paletteIndex={0}
            />
            {teacher?.active && (
              <span className='absolute -bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white' />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            {teacherLoading ? (
              <div className='h-8 w-48 animate-pulse rounded-md bg-ink-100' />
            ) : (
              <h1 className='text-[26px] font-semibold leading-tight tracking-tight text-ink-900 sm:text-[28px]'>
                {teacherName}
              </h1>
            )}
            <ul className='mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-600'>
              <li className='inline-flex items-center gap-2'>
                <Building2 size={14} className='text-ink-400' />
                Cód. {teacher?.institutional_code ?? "—"}
              </li>
              <li className='inline-flex items-center gap-2'>
                <Clock size={14} className='text-ink-400' /> {contractType}
              </li>
              <li className='inline-flex items-center gap-2'>
                <Calendar size={14} className='text-ink-400' /> Periodo
                Académico: {periodLabel}
              </li>
            </ul>
          </div>
        </div>

        {/* Stats — siempre debajo, sin conflicto con el sidebar */}
        <div className='mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <div className='rounded-lg border border-ink-200 bg-ink-50/40 px-4 py-3'>
            <div className='text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-ink-500'>
              Promedio Global
            </div>
            <div className='mt-2 flex items-baseline gap-1'>
              {detailLoading ? (
                <div className='h-8 w-16 animate-pulse rounded-md bg-ink-100' />
              ) : (
                <>
                  <span className='num text-[32px] font-semibold leading-none tabular-nums text-ink-900'>
                    {overallAverage > 0 ? overallAverage : "—"}
                  </span>
                  {overallAverage > 0 && (
                    <span className='text-[14px] font-medium text-ink-500'>
                      /5.0
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className='flex flex-col rounded-lg border border-ink-200 px-4 py-3'>
            <div className='text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500'>
              Nivel de Riesgo
            </div>
            <div className='mt-3'>
              {overallAverage > 0 ? (
                <span
                  className={cn(
                    "inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold",
                    risk.className,
                  )}
                >
                  {risk.label}
                </span>
              ) : (
                <span className='text-[12px] text-ink-400'>Sin datos</span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "col-span-2 rounded-lg border px-4 py-3 sm:col-span-1",
              recurrentLowPerformance
                ? "border-red-200/70 bg-red-50/50"
                : "border-emerald-200/70 bg-emerald-50/50",
            )}
          >
            <div
              className={cn(
                "inline-flex items-start gap-2 text-[11px] font-semibold leading-snug tracking-[0.04em]",
                recurrentLowPerformance ? "text-red-700" : "text-emerald-700",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  recurrentLowPerformance
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                <Check size={10} strokeWidth={3} />
              </span>
              <span className='uppercase'>
                Bajo desempeño recurrente:{" "}
                {recurrentLowPerformance ? "Detectado" : "No detectado"}
              </span>
            </div>
            <div
              className={cn(
                "mt-2 text-[10.5px]",
                recurrentLowPerformance
                  ? "text-red-700/70"
                  : "text-emerald-700/70",
              )}
            >
              * Basado en últimos 4 periodos
            </div>
          </div>
        </div>

        <Separator className='my-5' />

        <div className='flex flex-wrap gap-2'>
          <Link href={`/matrix/${teacherId}`}>
            <Button variant='brand' size='lg'>
              <FileText size={15} /> Ver Reporte Detallado Del docente
            </Button>
          </Link>
          <Button variant='outline' size='lg'>
            <Mail size={15} /> Enviar Citación
          </Button>
        </div>
      </Card>

      {noData ? (
        <Card className='p-10'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100'>
              <FileText size={24} className='text-ink-400' />
            </div>
            <div>
              <p className='text-[15px] font-semibold text-ink-800'>
                Sin evaluación disponible
              </p>
              <p className='mt-1.5 max-w-sm text-[13px] text-ink-500'>
                {selectedPeriod ? (
                  <>
                    Este docente no cuenta con evaluación docente en el periodo
                    académico{' '}
                    <span className='font-semibold text-ink-700'>
                      {selectedPeriod.name}
                    </span>
                    .
                  </>
                ) : (
                  'Selecciona un periodo académico en la barra superior.'
                )}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>

      {/* Dimensiones + Materias */}
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <Card className='h-full p-5 sm:p-6'>
          <div className='mb-5 flex items-start justify-between'>
            <h2 className='text-[17px] font-semibold text-ink-900'>
              Promedio por Dimensión
            </h2>
            <Info size={15} className='text-ink-400' />
          </div>
          {detailLoading ? (
            <ul>
              {[1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className='flex items-center justify-between py-3.5'
                >
                  <div className='h-3 w-44 animate-pulse rounded bg-ink-100' />
                  <div className='h-6 w-14 animate-pulse rounded bg-ink-100' />
                </li>
              ))}
            </ul>
          ) : !detail?.dimensions.length ? (
            <p className='text-[13px] text-ink-400'>
              {selectedPeriod
                ? "Sin datos de evaluación para este periodo."
                : "Selecciona un periodo académico."}
            </p>
          ) : (
            <ul className='divide-y divide-ink-100'>
              {detail.dimensions.map((dim) => (
                <li
                  key={dim.dimension}
                  className='flex items-center justify-between py-3.5'
                >
                  <span className='text-[13.5px] font-medium text-ink-700'>
                    {dim.dimension}
                  </span>
                  <div className='flex items-baseline gap-0.5 tabular-nums'>
                    <span className='num text-[22px] font-semibold text-ink-900'>
                      {dim.average}
                    </span>
                    <span className='text-[12px] font-medium text-ink-400'>
                      /5.0
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className='h-full p-5 sm:p-6'>
          <div className='mb-5 flex items-start justify-between'>
            <h2 className='text-[17px] font-semibold text-ink-900'>
              Promedio por Materia
            </h2>
            <Info size={15} className='text-ink-400' />
          </div>
          {detailLoading ? (
            <ul>
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className='flex items-center justify-between py-3.5'
                >
                  <div className='space-y-1.5'>
                    <div className='h-3 w-40 animate-pulse rounded bg-ink-100' />
                    <div className='h-2.5 w-24 animate-pulse rounded bg-ink-100' />
                  </div>
                  <div className='h-6 w-14 animate-pulse rounded bg-ink-100' />
                </li>
              ))}
            </ul>
          ) : !detail?.courses.length ? (
            <p className='text-[13px] text-ink-400'>
              {selectedPeriod
                ? "Sin materias registradas para este periodo."
                : "Selecciona un periodo académico."}
            </p>
          ) : (
            <ul className='divide-y divide-ink-100'>
              {detail.courses.map((course) => (
                <li
                  key={`${course.course_code}-${course.group_name}`}
                  className='flex items-center justify-between gap-4 py-3.5'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-[13.5px] font-medium text-ink-800'>
                      {course.course_name}
                    </p>
                    <p className='mt-0.5 text-[12px] text-ink-400'>
                      {course.group_name} · {course.respondent_count} encuestado
                      {course.respondent_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-baseline gap-0.5 tabular-nums'>
                    <span className='num text-[22px] font-semibold text-ink-900'>
                      {course.overall_average}
                    </span>
                    <span className='text-[12px] font-medium text-ink-400'>
                      /5.0
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Comments */}
      <Card className='overflow-hidden'>
        {/* Header */}
        <div className='flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-6'>
          <div>
            <h2 className='text-[20px] font-semibold text-ink-900'>
              Comentarios Detallados
            </h2>
            <p className='mt-1 text-[13px] text-ink-500'>
              Comentarios de estudiantes registrados en la evaluación del periodo.
            </p>
          </div>
          {totalCommentCount > 0 && (
            <span className='text-[13px] font-medium text-ink-500'>
              {displayComments.length}{activeCommentCourse !== "todas" && ` de ${totalCommentCount}`} comentario
              {totalCommentCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Course filter tabs — only when there are courses with comments */}
        {commentCourses.length > 0 && (
          <div className='border-b border-ink-100 px-5 pb-3 sm:px-6'>
            <div className='flex flex-wrap gap-1.5'>
              <button
                type='button'
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
                    type='button'
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
                        isActive ? "bg-white/20 text-white" : "bg-ink-100 text-ink-500",
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

        {/* Comment list */}
        {displayComments.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-12 text-center'>
            <MessageSquare size={28} className='text-ink-300' />
            <p className='text-[13px] text-ink-500'>
              {activeCommentCourse !== "todas"
                ? "Esta materia no obtuvo comentarios en esta evaluación docente."
                : selectedPeriod
                  ? "No hay comentarios registrados para este docente en el periodo seleccionado."
                  : "Selecciona un periodo académico para ver los comentarios."}
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-ink-100'>
            {displayComments.map((text, i) => (
              <li key={i} className='px-5 py-4 sm:px-6'>
                <p
                  className='max-w-180 text-[13.5px] leading-relaxed text-ink-800'
                  style={{ textWrap: "pretty" }}
                >
                  <span className='text-ink-400'>"</span>
                  {text}
                  <span className='text-ink-400'>"</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Evolución Histórica — ancho completo */}
      <Card className='p-5 sm:p-6'>
        <div className='mb-1 flex items-start justify-between'>
          <h2 className='text-[17px] font-semibold text-ink-900'>
            Evolución Histórica
          </h2>
          <div className='inline-flex items-center gap-1.5 text-[12px] text-ink-600'>
            <span className='h-2 w-2 rounded-full bg-brand-600' /> Promedio
            Global
          </div>
        </div>
        <p className='text-[12.5px] text-ink-500'>
          Últimos {chartData.length} periodos académicos
        </p>
        <div className='mt-4'>
          {chartData.length > 0 ? (
            <AreaChart
              data={chartData}
              yMin={1}
              yMax={5}
              yTicks={[2, 3, 4, 5]}
              width={640}
              height={160}
              formatValue={(value) => `${value.toFixed(1)}/5`}
            />
          ) : (
            <div className='flex h-40 items-center justify-center text-[13px] text-ink-400'>
              Sin historial disponible
            </div>
          )}
        </div>
      </Card>

      {/* Improvement plan — static placeholder */}
      <Card className='p-5 sm:p-6'>
        <div className='mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
          <div>
            <h2 className='text-[20px] font-semibold text-ink-900'>
              Plan de Mejoramiento Docente
            </h2>
            <p className='mt-1 text-[13px] text-ink-500'>
              Seguimiento de objetivos y hitos académicos para el periodo
              actual.
            </p>
          </div>
          <button
            disabled
            className='inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-400'
          >
            <Plus size={14} strokeWidth={2} /> Crear Plan de Mejoramiento
          </button>
        </div>

        <div className='relative pt-2'>
          <div className='absolute left-[16%] right-[16%] top-8.5 h-0.5 rounded-full bg-ink-100'>
            <div
              className='h-full rounded-full bg-brand-600 transition-all duration-700'
              style={{ width: "50%" }}
            />
          </div>
          <div className='relative grid grid-cols-3 gap-3'>
            {PLAN_STEPS.map((step) => (
              <div
                key={step.key}
                className='flex flex-col items-center px-2 text-center'
              >
                <StepIcon state={step.state} />
                <div className='mt-3 text-[13px] font-semibold text-ink-900'>
                  {step.label}
                </div>
                <div className='mt-0.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-500'>
                  {step.sub}
                </div>
                {step.state === "current" && (
                  <span className='mt-2 inline-flex h-5 items-center rounded-full border border-brand-200/70 bg-brand-50 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-brand-700'>
                    En Progreso
                  </span>
                )}
                {step.state === "done" && (
                  <span className='mt-2 inline-flex h-5 items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-700'>
                    Completado
                  </span>
                )}
                {step.state === "pending" && (
                  <span className='mt-2 inline-flex h-5 items-center rounded-full bg-ink-100 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500'>
                    Pendiente
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='mt-7 grid grid-cols-1 gap-3 md:grid-cols-2'>
          {PLAN_GOALS.map((goal) => (
            <div
              key={goal.title}
              className='rounded-lg border border-ink-200 bg-white px-4 py-4'
            >
              <div className='flex items-start gap-3'>
                <span
                  className={cn(
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    goal.done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-brand-50 text-brand-700",
                  )}
                >
                  {goal.done ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <span className='h-2 w-2 rounded-full bg-brand-600' />
                  )}
                </span>
                <div className='text-[13.5px] font-semibold text-ink-900'>
                  {goal.title}
                </div>
              </div>
              <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100'>
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    goal.done ? "bg-emerald-500" : "bg-brand-600",
                  )}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className='mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.04em]'>
                <span className='num tabular-nums text-ink-700'>
                  {goal.progress}%
                </span>
                <span
                  className={goal.done ? "text-emerald-700" : "text-brand-700"}
                >
                  {goal.done ? "Completado" : "En progreso"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
        </>
      )}

      <AppFooter>
        {periodLabel} · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  );
}
