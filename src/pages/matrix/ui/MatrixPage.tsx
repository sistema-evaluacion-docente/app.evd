import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Minus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";

import { EVALUATION_DIMENSIONS } from "@/entities/evaluation";
import {
  exportTeacherMatrix,
  useGetEvaluations,
  useGetTeacherEvaluationDetail,
  useGetTeacherVsDepartment,
} from "@/features/evaluations";
import { useGetTeacherById } from "@/features/teachers";
import { usePeriodsStore } from "@/features/periods";
import { cn } from "@/shared/lib/utils";
import {
  AppFooter,
  Avatar,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  ToggleSwitch,
} from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

const DIM_COLOR: Record<string, string> = Object.fromEntries(
  EVALUATION_DIMENSIONS.map((d) => [d.label, d.color]),
);
const DIM_ID: Record<string, string> = Object.fromEntries(
  EVALUATION_DIMENSIONS.map((d) => [d.label, d.id]),
);

function colorForDimension(name: string, index: number): string {
  return (
    DIM_COLOR[name] ??
    EVALUATION_DIMENSIONS[index % EVALUATION_DIMENSIONS.length]?.color ??
    "#0EA5E9"
  );
}

export function MatrixPage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = parseInt(id ?? "0", 10);
  const { selectedPeriod } = usePeriodsStore();

  const [activeCourse, setActiveCourse] = useState("todas");
  const [activeDim, setActiveDim] = useState("todas");
  const [search, setSearch] = useState("");
  const [insightMode, setInsightMode] = useState<"dimension" | "question">(
    "dimension",
  );
  const [insightCount, setInsightCount] = useState<3 | 5>(3);

  const [showExportModal, setShowExportModal] = useState(false);
  const [includeComments, setIncludeComments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!evaluation?.id) return;
    setIsExporting(true);
    try {
      const blob = await exportTeacherMatrix(
        evaluation.id,
        teacherId,
        includeComments,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `matriz_${teacherName}_${periodLabel}.xlsx`.replace(
        /\s+/g,
        "_",
      );
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } finally {
      setIsExporting(false);
    }
  }

  const { data: teacherRes, isLoading: teacherLoading } =
    useGetTeacherById(teacherId);
  const teacher = teacherRes?.data;

  const { data: evaluationsRes, isLoading: evaluationsLoading } =
    useGetEvaluations({
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

  const { data: comparisonRes } = useGetTeacherVsDepartment(
    teacherId,
    evaluation?.academic_period_id,
  );
  const comparison = comparisonRes?.data;

  const questionDeptScores = useMemo<Record<string, number>>(() => {
    if (!comparison) return {};
    const result: Record<string, number> = {};
    for (const dim of comparison.dimensions) {
      for (const q of dim.questions) {
        result[q.code] = q.department_average;
      }
    }
    return result;
  }, [comparison]);

  const dimDeptScores = useMemo<Record<string, number>>(() => {
    if (!comparison) return {};
    return Object.fromEntries(
      comparison.dimensions.map((d) => [d.dimension, d.department_average]),
    );
  }, [comparison]);

  const isLoading = teacherLoading || evaluationsLoading || detailLoading;

  const teacherName = detail?.name ?? teacher?.user?.name ?? "—";
  const periodLabel = detail?.period_name ?? selectedPeriod?.name ?? "—";

  const dimensionsWithColor = useMemo(
    () =>
      (detail?.dimensions ?? []).map((dim, i) => ({
        ...dim,
        color: colorForDimension(dim.dimension, i),
        dimId: DIM_ID[dim.dimension] ?? String(i),
      })),
    [detail],
  );

  const dimInsightRows = useMemo(
    () =>
      [...dimensionsWithColor]
        .sort((a, b) => b.average - a.average)
        .map((dim) => ({
          key: dim.dimension,
          label: dim.dimension,
          score: dim.average,
          color: dim.color,
        })),
    [dimensionsWithColor],
  );

  // Build question score lookup per course or aggregated
  const questionScores = useMemo<Record<string, number>>(() => {
    if (!detail?.courses.length) return {};

    if (activeCourse === "todas") {
      const totals: Record<string, { sum: number; count: number }> = {};
      for (const course of detail.courses) {
        for (const dim of course.dimensions) {
          for (const q of dim.questions ?? []) {
            if (!totals[q.code]) totals[q.code] = { sum: 0, count: 0 };
            totals[q.code].sum += q.score;
            totals[q.code].count += 1;
          }
        }
      }
      return Object.fromEntries(
        Object.entries(totals).map(([code, { sum, count }]) => [
          code,
          sum / count,
        ]),
      );
    }

    const course = detail.courses.find(
      (c) => `${c.course_code}-${c.group_name}` === activeCourse,
    );
    if (!course) return {};

    const result: Record<string, number> = {};
    for (const dim of course.dimensions) {
      for (const q of dim.questions ?? []) {
        result[q.code] = q.score;
      }
    }
    return result;
  }, [detail, activeCourse]);

  const questionInsightRows = useMemo(
    () =>
      EVALUATION_DIMENSIONS.flatMap((dim) =>
        dim.items
          .filter((item) => questionScores[item.code] !== undefined)
          .map((item) => ({
            key: item.code,
            label: item.label,
            sublabel: `${item.code} · ${dim.label}`,
            score: questionScores[item.code]!,
            color: dim.color,
          })),
      ).sort((a, b) => b.score - a.score),
    [questionScores],
  );

  const insightRows =
    insightMode === "dimension" ? dimInsightRows : questionInsightRows;
  const effectiveCount = insightMode === "dimension" ? 2 : insightCount;
  const insightStrengths = insightRows.slice(0, effectiveCount);
  const insightOpportunities = [...insightRows]
    .reverse()
    .slice(0, effectiveCount);

  // Dimension + item list for display
  const displayDimensions = useMemo(() => {
    return EVALUATION_DIMENSIONS.filter(
      (d) => activeDim === "todas" || d.id === activeDim,
    )
      .map((dim, dimIndex) => {
        const apiDim = dimensionsWithColor.find(
          (d) => d.dimension === dim.label,
        );
        const items = dim.items
          .map((item) => ({
            code: item.code,
            label: item.label,
            score: questionScores[item.code] ?? null,
            deptScore: questionDeptScores[item.code] ?? null,
          }))
          .filter((item) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
              item.label.toLowerCase().includes(q) || item.code.includes(q)
            );
          });
        const dimScores = dim.items
          .map((item) => questionScores[item.code])
          .filter((s): s is number => s !== undefined);
        const average =
          dimScores.length > 0
            ? dimScores.reduce((a, b) => a + b, 0) / dimScores.length
            : (apiDim?.average ?? 0);

        return {
          id: dim.id,
          label: dim.label,
          color: dim.color,
          number: dimIndex + 1,
          average,
          items,
        };
      })
      .filter((dim) => dim.items.length > 0);
  }, [activeDim, search, questionScores, dimensionsWithColor]);

  const noData = !isLoading && !detail;
  const hasQuestions = Object.keys(questionScores).length > 0;

  return (
    <AppLayout
      header={{
        rightMode: "periodo",
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link
              href='/teachers'
              className='transition-colors hover:text-foreground'
            >
              Docentes
            </Link>
            <ChevronRight size={12} className='text-muted-foreground' />
            <Link
              href={`/teachers/${teacherId}`}
              className='transition-colors hover:text-foreground'
            >
              {teacherName}
            </Link>
            <ChevronRight size={12} className='text-muted-foreground' />
            <span className='font-medium text-foreground'>
              Matriz de Evaluación
            </span>
          </>
        ),
      }}
    >
      <PageHeader
        title='Matriz de Evaluación Docente'
        description='Evaluación por estudiantes según los 22 ítems institucionales UFPS, agrupados en 4 dimensiones.'
        actions={
          <Button
            variant='outline'
            size='lg'
            onClick={() => setShowExportModal(true)}
            disabled={!detail}
          >
            <Download size={14} />
            Exportar matriz
          </Button>
        }
      />

      {/* Profile summary */}
      <Card className='p-5 sm:p-6'>
        <div className='flex flex-wrap items-center gap-4'>
          <Avatar
            name={teacherName}
            src={teacher?.user?.avatar_url || undefined}
            size={56}
            paletteIndex={0}
          />
          <div className='min-w-0 flex-1'>
            <div className='text-[18px] font-semibold text-foreground'>
              {teacherName}
            </div>
            <div className='mt-0.5 text-[13px] text-muted-foreground'>
              Cód.{" "}
              {detail?.institutional_code ?? teacher?.institutional_code ?? "—"}{" "}
              · {periodLabel}
            </div>
          </div>
          {detail && (
            <div className='flex items-center gap-4 sm:gap-6'>
              <div className='text-right'>
                <div className='text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
                  Promedio Individual
                </div>
                <div className='mt-1 flex items-baseline justify-end gap-1'>
                  <span className='num text-[34px] font-semibold leading-none tabular-nums text-foreground'>
                    {detail.overall_average.toFixed(2)}
                  </span>
                  <span className='text-[13px] font-medium text-muted-foreground'>
                    /5.0
                  </span>
                </div>
              </div>
              {comparison && (
                <>
                  <div className='hidden h-12 w-px bg-border sm:block' />
                  <div className='text-right'>
                    <div className='text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
                      Promedio Depto.
                    </div>
                    <div className='mt-1 flex items-baseline justify-end gap-1'>
                      <span className='num text-[34px] font-semibold leading-none tabular-nums text-muted-foreground'>
                        {comparison.department_overall_average.toFixed(2)}
                      </span>
                      <span className='text-[13px] font-medium text-muted-foreground'>
                        /5.0
                      </span>
                    </div>
                  </div>
                  <div className='hidden h-12 w-px bg-border sm:block' />
                  <DeltaBadge
                    delta={
                      detail.overall_average -
                      comparison.department_overall_average
                    }
                    size='lg'
                  />
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Empty state */}
      {noData && (
        <Card className='p-10'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-muted'>
              <BarChart3 size={24} className='text-muted-foreground' />
            </div>
            <div>
              <p className='text-[15px] font-semibold text-foreground'>
                Sin evaluación disponible
              </p>
              <p className='mt-1.5 text-[13px] text-muted-foreground'>
                {selectedPeriod ? (
                  <>
                    Este docente no cuenta con evaluación docente en el periodo
                    académico{" "}
                    <span className='font-semibold text-foreground'>
                      {selectedPeriod.name}
                    </span>
                    .
                  </>
                ) : (
                  "Selecciona un periodo académico en la barra superior para ver la matriz."
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dimension summary cards */}
      {(isLoading || dimensionsWithColor.length > 0) && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <Card key={i} className='h-32 animate-pulse bg-muted' />
              ))
            : dimensionsWithColor.map((dim, i) => {
                const deptAvg = dimDeptScores[dim.dimension];
                const delta =
                  deptAvg !== undefined ? dim.average - deptAvg : null;
                return (
                  <Card key={dim.dimension} className='p-5'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <div className='text-[10.5px] font-semibold uppercase leading-snug tracking-[0.08em] text-muted-foreground'>
                          {dim.dimension}
                        </div>
                        <div className='mt-0.5 text-[11px] text-muted-foreground'>
                          {EVALUATION_DIMENSIONS[i]?.items.length ?? 0} ítems
                        </div>
                      </div>
                      <span
                        className='mt-1 h-2 w-2 shrink-0 rounded-full'
                        style={{ background: dim.color }}
                      />
                    </div>
                    <div className='mt-4 flex items-baseline gap-2'>
                      <span className='num text-[32px] font-semibold leading-none tabular-nums text-foreground'>
                        {dim.average.toFixed(2)}
                      </span>
                      <span className='text-[13px] font-medium text-muted-foreground'>
                        /5.0
                      </span>
                      {delta !== null && (
                        <span className='ml-auto'>
                          <DeltaBadge delta={delta} />
                        </span>
                      )}
                    </div>
                    <div className='mt-3 space-y-1.5'>
                      <ComparisonBar
                        label='Individual'
                        value={dim.average}
                        color={dim.color}
                        emphasis
                      />
                      {deptAvg !== undefined && (
                        <ComparisonBar
                          label='Departamento'
                          value={deptAvg}
                          color='#9AA0AB'
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
        </div>
      )}

      {/* Insights */}
      {!isLoading && dimensionsWithColor.length > 0 && (
        <div className='flex flex-col gap-3'>
          {/* Insight controls */}
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1.5'>
              <FilterChip
                active={insightMode === "dimension"}
                onClick={() => setInsightMode("dimension")}
              >
                Por dimensión
              </FilterChip>
              <FilterChip
                active={insightMode === "question"}
                onClick={() => setInsightMode("question")}
              >
                Por ítem
              </FilterChip>
            </div>
            {insightMode === "question" && (
              <>
                <div className='h-4 w-px bg-border' />
                <div className='flex items-center gap-1.5'>
                  <FilterChip
                    active={insightCount === 3}
                    onClick={() => setInsightCount(3)}
                  >
                    Top 3
                  </FilterChip>
                  <FilterChip
                    active={insightCount === 5}
                    onClick={() => setInsightCount(5)}
                  >
                    Top 5
                  </FilterChip>
                </div>
              </>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <InsightCard
              title='Fortalezas'
              subtitle={
                insightMode === "dimension"
                  ? "Dimensiones con mejor desempeño"
                  : "Ítems con mejor puntaje"
              }
              dotClass='bg-emerald-500'
              rows={insightStrengths}
            />
            <InsightCard
              title='Oportunidades de mejora'
              subtitle={
                insightMode === "dimension"
                  ? "Dimensiones que requieren atención"
                  : "Ítems con puntaje más bajo"
              }
              dotClass='bg-brand-600'
              rows={insightOpportunities}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {!isLoading && detail && (
        <Card className='p-3 sm:p-4'>
          <div className='flex flex-col gap-3'>
            {/* Course pills */}
            <div className='-mx-1 flex items-center gap-1.5 overflow-x-auto px-1'>
              <FilterChip
                active={activeCourse === "todas"}
                onClick={() => setActiveCourse("todas")}
              >
                Todas las materias
              </FilterChip>
              {detail.courses.map((course) => {
                const key = `${course.course_code}-${course.group_name}`;
                return (
                  <FilterChip
                    key={key}
                    active={activeCourse === key}
                    onClick={() => setActiveCourse(key)}
                  >
                    {course.course_name} · {course.group_name}
                  </FilterChip>
                );
              })}
            </div>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              {/* Search */}
              <div className='min-w-0 flex-1'>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Buscar por ítem o código (001–022)...'
                  icon={<Search size={14} />}
                />
              </div>
              {/* Dimension chips */}
              <div className='-mx-1 flex items-center gap-1.5 overflow-x-auto px-1'>
                <FilterChip
                  active={activeDim === "todas"}
                  onClick={() => setActiveDim("todas")}
                >
                  Todas
                </FilterChip>
                {EVALUATION_DIMENSIONS.map((dim) => (
                  <FilterChip
                    key={dim.id}
                    active={activeDim === dim.id}
                    onClick={() => setActiveDim(dim.id)}
                    dotColor={dim.color}
                  >
                    {dim.label.split(" ").slice(-2).join(" ")}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Item matrix */}
      {!isLoading && hasQuestions && displayDimensions.length === 0 && (
        <Card className='p-10 text-center text-[13px] text-muted-foreground'>
          Sin resultados para los filtros aplicados.
        </Card>
      )}

      {!isLoading &&
        hasQuestions &&
        displayDimensions.map((dim, dimIndex) => (
          <Card key={dim.id} className='overflow-hidden'>
            <div className='flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6'>
              <span
                className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[14px] font-semibold text-white'
                style={{ background: dim.color }}
              >
                {dimIndex + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <h2 className='text-[17px] font-semibold text-foreground'>
                  {dim.label}
                </h2>
                <p className='text-[12px] text-muted-foreground'>
                  {dim.items.length} ítems · ítems {dim.items[0]?.code}–
                  {dim.items[dim.items.length - 1]?.code}
                </p>
              </div>
              <span className='inline-flex h-7 items-center rounded-full border border-border bg-muted px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground'>
                {dim.average.toFixed(2)} / 5
              </span>
            </div>
            <div className='px-5 py-2 sm:px-6'>
              {dim.items.map((item) => (
                <div
                  key={item.code}
                  className='grid grid-cols-[88px_1fr_80px] items-center gap-4 border-b border-border py-3 last:border-b-0'
                >
                  <span className='num inline-flex w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] font-semibold text-foreground'>
                    {item.code}
                  </span>
                  <div className='min-w-0'>
                    <div
                      className='mb-2 pr-2 text-[13.5px] leading-snug text-foreground'
                      style={{ textWrap: "pretty" }}
                    >
                      {item.label}
                    </div>
                    {item.score !== null && (
                      <div className='space-y-1'>
                        <ItemBar
                          value={item.score}
                          color={dim.color}
                          label='Individual'
                          emphasis
                        />
                        {item.deptScore !== null && (
                          <ItemBar
                            value={item.deptScore}
                            color='#9AA0AB'
                            label='Depto.'
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col items-end'>
                    {item.score !== null && item.deptScore !== null ? (
                      <DeltaBadge delta={item.score - item.deptScore} />
                    ) : item.score !== null ? (
                      <>
                        <span className='num text-[14px] font-semibold tabular-nums text-foreground'>
                          {item.score.toFixed(2)}
                        </span>
                        <div className='mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground'>
                          / 5
                        </div>
                      </>
                    ) : (
                      <span className='text-[12px] text-muted-foreground'>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

      <AppFooter>Matriz de Evaluación · {periodLabel} · v2.1</AppFooter>

      <Modal
        open={showExportModal}
        onClose={() => !isExporting && setShowExportModal(false)}
        widthClass='max-w-sm'
      >
        <div className='p-6'>
          <div className='mb-1 flex items-center gap-2.5'>
            <FileSpreadsheet size={18} className='text-foreground' />
            <h2 className='text-[16px] font-semibold text-foreground'>
              Exportar matriz
            </h2>
          </div>
          <p className='mb-6 text-[13px] text-muted-foreground'>
            Se generará un archivo Excel con la matriz de evaluación de{" "}
            <span className='font-medium text-foreground'>{teacherName}</span> en
            el periodo{" "}
            <span className='font-medium text-foreground'>{periodLabel}</span>.
          </p>

          <div className='flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3'>
            <div>
              <p className='text-[13px] font-medium text-foreground'>
                Incluir comentarios
              </p>
              <p className='mt-0.5 text-[12px] text-muted-foreground'>
                Agrega una hoja con los comentarios por materia
              </p>
            </div>
            <ToggleSwitch
              value={includeComments}
              onChange={setIncludeComments}
              label='Incluir comentarios'
            />
          </div>

          <div className='mt-5 flex items-center justify-end gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowExportModal(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button size='sm' onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                "Descargando..."
              ) : (
                <>
                  <Download size={13} />
                  Descargar
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function ItemBar({
  value,
  color,
  label,
  emphasis,
}: {
  value: number;
  color: string;
  label?: string;
  emphasis?: boolean;
}) {
  return (
    <div className='flex items-center gap-2'>
      {label && (
        <span
          className={cn(
            "w-20 shrink-0 text-[10px] font-semibold uppercase tracking-[0.04em]",
            emphasis ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      )}
      <div className='relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted'>
        <div
          className='absolute inset-y-0 left-0 rounded-full transition-all duration-700'
          style={{ width: `${(value / 5) * 100}%`, background: color }}
        />
      </div>
      {label && (
        <span
          className={cn(
            "num w-8 text-right text-[11px] font-semibold tabular-nums",
            emphasis ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {value.toFixed(2)}
        </span>
      )}
    </div>
  );
}

function DeltaBadge({
  delta,
  size = "sm",
}: {
  delta: number;
  size?: "sm" | "lg";
}) {
  const isAbove = delta > 0.005;
  const isBelow = delta < -0.005;
  const Icon = isAbove ? ArrowUp : isBelow ? ArrowDown : Minus;
  const colorClass = isAbove
    ? "text-emerald-700"
    : isBelow
      ? "text-red-600"
      : "text-amber-600";
  const iconSize = size === "lg" ? 16 : 11;
  const textClass = size === "lg" ? "text-[22px]" : "text-[13px]";

  return (
    <div
      className={cn("flex flex-col items-end", size === "lg" && "text-right")}
    >
      {size === "lg" && (
        <div className='text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
          Diferencia
        </div>
      )}
      <div
        className={cn(
          "num mt-0.5 inline-flex items-center gap-0.5 font-semibold tabular-nums",
          colorClass,
          textClass,
        )}
      >
        <Icon size={iconSize} />
        {Math.abs(delta).toFixed(2)}
      </div>
      {size === "sm" && (
        <div className='text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground'>
          vs. depto.
        </div>
      )}
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  color,
  emphasis,
}: {
  label: string;
  value: number;
  color: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className='flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em]'>
        <span className={emphasis ? "text-foreground" : "text-muted-foreground"}>
          {label}
        </span>
        <span
          className={cn(
            "num tabular-nums",
            emphasis ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-muted'>
        <div
          className='h-full transition-all duration-500'
          style={{ width: `${(value / 5) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  dotColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dotColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {dotColor && (
        <span
          className='h-1.5 w-1.5 rounded-full'
          style={{ background: dotColor }}
        />
      )}
      {children}
    </button>
  );
}

type InsightRow = {
  key: string;
  label: string;
  sublabel?: string;
  score: number;
  color: string;
};

function InsightCard({
  title,
  subtitle,
  dotClass,
  rows,
}: {
  title: string;
  subtitle: string;
  dotClass: string;
  rows: InsightRow[];
}) {
  return (
    <Card className='p-5'>
      <div className='mb-1 flex items-center gap-2'>
        <span className={cn("h-2 w-2 rounded-full", dotClass)} />
        <h3 className='text-[14px] font-semibold text-foreground'>{title}</h3>
      </div>
      <p className='mb-4 text-[12px] text-muted-foreground'>{subtitle}</p>
      <ul className='space-y-3'>
        {rows.map((row) => (
          <li key={row.key} className='flex items-center gap-3'>
            <span
              className='h-2 w-2 shrink-0 rounded-full'
              style={{ background: row.color }}
            />
            <div className='min-w-0 flex-1'>
              <div className='text-[13px] leading-snug text-foreground'>
                {row.label}
              </div>
              {row.sublabel && (
                <div className='mt-0.5 text-[11px] text-muted-foreground'>
                  {row.sublabel}
                </div>
              )}
            </div>
            <span className='num shrink-0 text-[14px] font-semibold tabular-nums text-foreground'>
              {row.score.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
