import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  FileText,
  Info,
  Mail,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'

import { cn } from '@/shared/lib/utils'
import {
  AppFooter,
  AreaChart,
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  FilterPills,
  Separator,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

type RiskLevel = 'alto' | 'medio' | 'bajo'

interface TeacherComment {
  id: number
  text: string
  risk: RiskLevel
  tag: string
}

const TEACHER = {
  name: 'Dr. Roberto Jiménez',
  faculty: 'Facultad de Ingeniería',
  vinculacion: 'Tiempo Completo',
  periodo: '2024-1',
  average: 4.3,
  recurrentLowPerformance: false,
  dimensions: [
    { id: 'desempeno', label: 'Desempeño Docente', value: 92 },
    { id: 'desarrollo', label: 'Desarrollo del Conocimiento', value: 85 },
    { id: 'procesos', label: 'Procesos de Evaluación', value: 95 },
    { id: 'integracion', label: 'Integración Interpersonal', value: 88 },
  ],
  history: [
    { label: '2022-1', value: 3.6 },
    { label: '2022-2', value: 4.0 },
    { label: '2023-1', value: 3.9 },
    { label: '2023-2', value: 4.2 },
    { label: '2024-1', value: 4.3 },
  ],
  comments: [
    { id: 1, text: 'Las explicaciones son muy claras y siempre está dispuesto a resolver dudas fuera de clase.', risk: 'alto', tag: 'Desempeño Docente' },
    { id: 2, text: 'A veces los criterios de calificación no se explican con suficiente claridad al inicio del curso.', risk: 'medio', tag: 'Procesos de Evaluación' },
    { id: 3, text: 'Es muy accesible y mantiene buena comunicación con el grupo durante todo el semestre.', risk: 'bajo', tag: 'Integración Interpersonal' },
    { id: 4, text: 'El ritmo del curso fue muy acelerado en los últimos temas. Sugeriría más ejemplos prácticos.', risk: 'medio', tag: 'Desarrollo del Conocimiento' },
  ] as TeacherComment[],
}

const PLAN_STEPS = [
  { key: 'inicio', label: 'Inicio', sub: 'Feb 15, 2024', state: 'done' as const },
  { key: 'medio', label: 'Mitad de Semestre', sub: 'Abr 20, 2024', state: 'current' as const },
  { key: 'final', label: 'Final de Semestre', sub: 'Jun 30, 2024', state: 'pending' as const },
]

const PLAN_GOALS = [
  { title: 'Meta 1: Actualización de Syllabus', progress: 100, done: true },
  { title: 'Meta 2: Formación en Herramientas Digitales', progress: 45, done: false },
]

const RISK_BADGE: Record<RiskLevel, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  alto: { label: 'ALTO', variant: 'danger' },
  medio: { label: 'MEDIO', variant: 'warning' },
  bajo: { label: 'BAJO', variant: 'success' },
}

function StepIcon({ state }: { state: 'done' | 'current' | 'pending' }) {
  if (state === 'done') {
    return (
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-white">
        <Check size={20} strokeWidth={2.4} />
      </div>
    )
  }
  if (state === 'current') {
    return (
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white ring-4 ring-brand-100">
        <TrendingUp size={20} />
      </div>
    )
  }
  return (
    <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-ink-100 text-ink-400">
      <Clock size={18} />
    </div>
  )
}

export function TeacherDetailPage() {
  const [riskFilter, setRiskFilter] = useState('todos')

  const filteredComments = useMemo(
    () =>
      riskFilter === 'todos'
        ? TEACHER.comments
        : TEACHER.comments.filter((comment) => comment.risk === riskFilter),
    [riskFilter],
  )

  const commentColumns: DataTableColumn<TeacherComment>[] = [
    {
      header: 'Comentario del estudiante',
      cellClassName: 'align-top py-4 max-w-[640px]',
      cell: (comment) => (
        <p
          className="text-[13.5px] leading-relaxed text-ink-800"
          style={{ textWrap: 'pretty' }}
        >
          <span className="text-ink-400">“</span>
          {comment.text}
          <span className="text-ink-400">”</span>
        </p>
      ),
    },
    {
      header: 'Riesgo',
      cellClassName: 'align-top py-4',
      cell: (comment) => {
        const badge = RISK_BADGE[comment.risk]
        return <Badge variant={badge.variant}>{badge.label}</Badge>
      },
    },
    {
      header: 'Etiqueta',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="inline-flex h-6 items-center rounded-full border border-ink-200 bg-ink-50/60 px-2.5 text-[11px] font-medium text-ink-700">
          {comment.tag}
        </span>
      ),
    },
  ]

  return (
    <AppLayout
      role="director"
      header={{
        rightMode: 'search',
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link href="/teachers" className="shrink-0 transition-colors hover:text-ink-900">
              Directorio
            </Link>
            <ArrowRight size={12} className="shrink-0 -rotate-0 text-ink-300" />
            <Link href="/teachers" className="truncate transition-colors hover:text-ink-900">
              {TEACHER.faculty}
            </Link>
            <ArrowRight size={12} className="shrink-0 text-ink-300" />
            <span className="truncate font-medium text-ink-900">{TEACHER.name}</span>
          </>
        ),
      }}
    >
      {/* Profile header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="relative shrink-0">
              <Avatar name={TEACHER.name} size={80} paletteIndex={0} />
              <span className="absolute -bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink-900 sm:text-[28px]">
                {TEACHER.name}
              </h1>
              <ul className="mt-3 space-y-1.5 text-[13.5px] text-ink-600">
                <li className="inline-flex items-center gap-2">
                  <Building2 size={14} className="text-ink-400" /> {TEACHER.faculty}
                </li>
                <li className="inline-flex items-center gap-2 sm:ml-4">
                  <Clock size={14} className="text-ink-400" /> {TEACHER.vinculacion}
                </li>
                <li className="inline-flex items-center gap-2 sm:ml-4">
                  <Calendar size={14} className="text-ink-400" /> Periodo Académico:{' '}
                  {TEACHER.periodo}
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-auto lg:min-w-[480px] lg:grid-cols-3">
            <div className="rounded-lg border border-ink-200 bg-ink-50/40 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-ink-500">
                Promedio
                <br />
                Global
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="num text-[32px] font-semibold leading-none tabular-nums text-ink-900">
                  {TEACHER.average.toFixed(1)}
                </span>
                <span className="text-[14px] font-medium text-ink-500">/5</span>
              </div>
            </div>
            <div className="flex flex-col rounded-lg border border-ink-200 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Nivel de Riesgo
              </div>
              <div className="mt-3">
                <span className="inline-flex h-7 items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-700">
                  NORMAL
                </span>
              </div>
            </div>
            <div className="col-span-2 rounded-lg border border-emerald-200/70 bg-emerald-50/50 px-4 py-3 lg:col-span-1">
              <div className="inline-flex items-start gap-2 text-[11px] font-semibold leading-snug tracking-[0.04em] text-emerald-700">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className="uppercase">
                  Bajo desempeño recurrente:{' '}
                  {TEACHER.recurrentLowPerformance ? 'Detectado' : 'No detectado'}
                </span>
              </div>
              <div className="mt-2 text-[10.5px] text-emerald-700/70">
                * Basado en últimos 4 periodos
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-wrap gap-2">
          <Button variant="brand" size="lg">
            <FileText size={15} /> Generar Reporte Detallado
          </Button>
          <Button variant="outline" size="lg">
            <Mail size={15} /> Enviar Citación
          </Button>
          <Button variant="outline" size="lg">
            <FileText size={15} /> Exportar Evaluación Individual (PDF)
          </Button>
        </div>
      </Card>

      {/* Dimensions + history */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="h-full p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <h2 className="text-[17px] font-semibold text-ink-900">
              Promedio por Dimensión
            </h2>
            <Info size={15} className="text-ink-400" />
          </div>
          <ul className="space-y-5">
            {TEACHER.dimensions.map((dimension) => (
              <li key={dimension.id}>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-700">
                  <span>{dimension.label}</span>
                  <span className="num tabular-nums text-ink-900">
                    {dimension.value}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full bg-ink-800 transition-all duration-700"
                    style={{ width: `${dimension.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="h-full p-5 sm:p-6">
          <div className="mb-1 flex items-start justify-between">
            <h2 className="text-[17px] font-semibold text-ink-900">
              Evolución Histórica
            </h2>
            <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
              <span className="h-2 w-2 rounded-full bg-brand-600" /> Promedio Global
            </div>
          </div>
          <p className="text-[12.5px] text-ink-500">Últimos 5 periodos académicos</p>
          <div className="mt-4">
            <AreaChart
              data={TEACHER.history}
              yMin={1}
              yMax={5}
              yTicks={[2, 3, 4, 5]}
              width={640}
              height={240}
              formatValue={(value) => `${value.toFixed(1)}/5`}
            />
          </div>
        </Card>
      </div>

      {/* Improvement plan */}
      <Card className="p-5 sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-[20px] font-semibold text-ink-900">
              Plan de Mejoramiento Docente
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Seguimiento de objetivos y hitos académicos para el periodo actual.
            </p>
          </div>
          <Link
            href="/plans"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:bg-ink-50"
          >
            <Plus size={14} strokeWidth={2} /> Crear Plan de Mejoramiento
          </Link>
        </div>

        <div className="relative pt-2">
          <div className="absolute left-[16%] right-[16%] top-[34px] h-[2px] rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-700"
              style={{ width: '50%' }}
            />
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {PLAN_STEPS.map((step) => (
              <div
                key={step.key}
                className="flex flex-col items-center px-2 text-center"
              >
                <StepIcon state={step.state} />
                <div className="mt-3 text-[13px] font-semibold text-ink-900">
                  {step.label}
                </div>
                <div className="mt-0.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-500">
                  {step.sub}
                </div>
                {step.state === 'current' && (
                  <span className="mt-2 inline-flex h-5 items-center rounded-full border border-brand-200/70 bg-brand-50 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-brand-700">
                    En Progreso
                  </span>
                )}
                {step.state === 'done' && (
                  <span className="mt-2 inline-flex h-5 items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-700">
                    Completado
                  </span>
                )}
                {step.state === 'pending' && (
                  <span className="mt-2 inline-flex h-5 items-center rounded-full bg-ink-100 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
                    Pendiente
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
          {PLAN_GOALS.map((goal) => (
            <div
              key={goal.title}
              className="rounded-lg border border-ink-200 bg-white px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    goal.done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {goal.done ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                  )}
                </span>
                <div className="text-[13.5px] font-semibold text-ink-900">
                  {goal.title}
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    goal.done ? 'bg-emerald-500' : 'bg-brand-600',
                  )}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.04em]">
                <span className="num tabular-nums text-ink-700">
                  {goal.progress}%
                </span>
                <span className={goal.done ? 'text-emerald-700' : 'text-brand-700'}>
                  {goal.done ? 'Completado' : 'En progreso'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comments */}
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-[20px] font-semibold text-ink-900">
              Comentarios Detallados
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Análisis automático con clasificación por nivel de riesgo y dimensión.
            </p>
          </div>
          <FilterPills
            value={riskFilter}
            onChange={setRiskFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'alto', label: 'Alto' },
              { value: 'medio', label: 'Medio' },
              { value: 'bajo', label: 'Bajo' },
            ]}
          />
        </div>
        <DataTable
          columns={commentColumns}
          rows={filteredComments}
          rowKey={(comment) => comment.id}
          headerVariant="muted"
          minWidth={680}
          emptyMessage="No hay comentarios para este filtro."
        />
      </Card>

      <AppFooter>
        Periodo Académico {TEACHER.periodo} · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  )
}
