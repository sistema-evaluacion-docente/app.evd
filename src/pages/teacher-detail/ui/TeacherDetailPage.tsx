import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  Eraser,
  FileText,
  Info,
  Plus,
  Search,
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
  Input,
  Select,
  Separator,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

type RiskLevel = 'alto' | 'medio' | 'bajo'
type RiskTone = 'success' | 'warning' | 'danger'

interface TeacherComment {
  id: number
  text: string
  risk: RiskLevel
  tag: string
  subject: string
  semester: string
}

interface Dimension {
  id: string
  label: string
  value: number
}

interface SemesterStats {
  average: number
  risk: { label: string; tone: RiskTone }
  recurrentLowPerformance: boolean
  dimensions: Dimension[]
}

interface PlanStep {
  key: string
  label: string
  sub: string
  state: 'done' | 'current' | 'pending'
}

interface PlanGoal {
  title: string
  progress: number
  done: boolean
}

interface ImprovementPlan {
  progress: number
  steps: PlanStep[]
  goals: PlanGoal[]
}

const TEACHER = {
  name: 'Dr. Roberto Jiménez',
  faculty: 'Facultad de Ingeniería',
  vinculacion: 'Tiempo Completo',
}

const SEMESTERS = ['2024-1', '2023-2', '2023-1']

const DIMENSION_LABELS = [
  'Desempeño Docente',
  'Desarrollo del Conocimiento',
  'Procesos de Evaluación',
  'Integración Interpersonal',
]

/** Global evolution across periods (independent of the selected semester). */
const HISTORY = [
  { label: '2022-1', value: 3.6 },
  { label: '2022-2', value: 3.9 },
  { label: '2023-1', value: 3.4 },
  { label: '2023-2', value: 4.0 },
  { label: '2024-1', value: 4.3 },
]

const SEMESTER_STATS: Record<string, SemesterStats> = {
  '2024-1': {
    average: 4.3,
    risk: { label: 'NORMAL', tone: 'success' },
    recurrentLowPerformance: false,
    dimensions: [
      { id: 'desempeno', label: 'Desempeño Docente', value: 92 },
      { id: 'desarrollo', label: 'Desarrollo del Conocimiento', value: 85 },
      { id: 'procesos', label: 'Procesos de Evaluación', value: 95 },
      { id: 'integracion', label: 'Integración Interpersonal', value: 88 },
    ],
  },
  '2023-2': {
    average: 4.0,
    risk: { label: 'NORMAL', tone: 'success' },
    recurrentLowPerformance: false,
    dimensions: [
      { id: 'desempeno', label: 'Desempeño Docente', value: 88 },
      { id: 'desarrollo', label: 'Desarrollo del Conocimiento', value: 80 },
      { id: 'procesos', label: 'Procesos de Evaluación', value: 90 },
      { id: 'integracion', label: 'Integración Interpersonal', value: 84 },
    ],
  },
  '2023-1': {
    average: 3.4,
    risk: { label: 'SEGUIMIENTO', tone: 'warning' },
    recurrentLowPerformance: true,
    dimensions: [
      { id: 'desempeno', label: 'Desempeño Docente', value: 74 },
      { id: 'desarrollo', label: 'Desarrollo del Conocimiento', value: 66 },
      { id: 'procesos', label: 'Procesos de Evaluación', value: 78 },
      { id: 'integracion', label: 'Integración Interpersonal', value: 71 },
    ],
  },
}

const PLANS: Record<string, ImprovementPlan | null> = {
  '2024-1': {
    progress: 50,
    steps: [
      { key: 'inicio', label: 'Inicio', sub: 'Feb 15, 2024', state: 'done' },
      { key: 'medio', label: 'Mitad de Semestre', sub: 'Abr 20, 2024', state: 'current' },
      { key: 'final', label: 'Final de Semestre', sub: 'Jun 30, 2024', state: 'pending' },
    ],
    goals: [
      { title: 'Meta 1: Actualización de Syllabus', progress: 100, done: true },
      { title: 'Meta 2: Formación en Herramientas Digitales', progress: 45, done: false },
    ],
  },
  // El periodo 2023-2 no tiene un plan de mejoramiento activo (estado vacío).
  '2023-2': null,
  '2023-1': {
    progress: 100,
    steps: [
      { key: 'inicio', label: 'Inicio', sub: 'Feb 10, 2023', state: 'done' },
      { key: 'medio', label: 'Mitad de Semestre', sub: 'Abr 18, 2023', state: 'done' },
      { key: 'final', label: 'Final de Semestre', sub: 'Jun 28, 2023', state: 'done' },
    ],
    goals: [
      { title: 'Meta 1: Refuerzo en Evaluación Formativa', progress: 100, done: true },
      { title: 'Meta 2: Acompañamiento Pedagógico', progress: 100, done: true },
    ],
  },
}

const COMMENTS: TeacherComment[] = [
  { id: 1, semester: '2024-1', subject: 'Cálculo Diferencial', risk: 'alto', tag: 'Desempeño Docente', text: 'Las explicaciones son muy claras y siempre está dispuesto a resolver dudas fuera de clase, incluso programando sesiones adicionales de refuerzo cuando un tema se complica para el grupo.' },
  { id: 2, semester: '2024-1', subject: 'Cálculo Diferencial', risk: 'medio', tag: 'Procesos de Evaluación', text: 'A veces los criterios de calificación no se explican con suficiente claridad al inicio del curso.' },
  { id: 3, semester: '2024-1', subject: 'Álgebra Lineal', risk: 'bajo', tag: 'Integración Interpersonal', text: 'Es muy accesible y mantiene buena comunicación con el grupo durante todo el semestre.' },
  { id: 4, semester: '2024-1', subject: 'Álgebra Lineal', risk: 'medio', tag: 'Desarrollo del Conocimiento', text: 'El ritmo del curso fue muy acelerado en los últimos temas. Sugeriría incluir más ejemplos prácticos y ejercicios guiados antes de pasar a los parciales para asentar los conceptos.' },
  { id: 5, semester: '2023-2', subject: 'Cálculo Integral', risk: 'bajo', tag: 'Desempeño Docente', text: 'Domina muy bien la materia y transmite seguridad al explicar.' },
  { id: 6, semester: '2023-2', subject: 'Cálculo Integral', risk: 'medio', tag: 'Procesos de Evaluación', text: 'Los parciales no siempre reflejan lo trabajado en clase; algunos ejercicios tenían un nivel de dificultad muy por encima de los ejemplos vistos durante las sesiones.' },
  { id: 7, semester: '2023-2', subject: 'Ecuaciones Diferenciales', risk: 'bajo', tag: 'Integración Interpersonal', text: 'Genera un ambiente de respeto y motiva la participación de todos.' },
  { id: 8, semester: '2023-1', subject: 'Cálculo Diferencial', risk: 'alto', tag: 'Desarrollo del Conocimiento', text: 'El material de apoyo quedó desactualizado y en varios temas tuvimos que recurrir a fuentes externas; sería ideal renovar las guías y la bibliografía del curso para el próximo semestre.' },
  { id: 9, semester: '2023-1', subject: 'Física I', risk: 'medio', tag: 'Desempeño Docente', text: 'Buen manejo del tema, aunque en ocasiones avanza rápido sin verificar si el grupo comprendió.' },
  { id: 10, semester: '2023-1', subject: 'Física I', risk: 'bajo', tag: 'Procesos de Evaluación', text: 'La retroalimentación de los trabajos fue oportuna y detallada.' },
]

const RISK_BADGE: Record<RiskLevel, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  alto: { label: 'ALTO', variant: 'danger' },
  medio: { label: 'MEDIO', variant: 'warning' },
  bajo: { label: 'BAJO', variant: 'success' },
}

const RISK_TONE_CLASS: Record<RiskTone, string> = {
  success: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200/70 bg-amber-50 text-amber-700',
  danger: 'border-rose-200/70 bg-rose-50 text-rose-700',
}

const COMMENT_PREVIEW = 120

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

function EmptyPlanState({ semester }: { semester: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
        <ClipboardList size={34} strokeWidth={1.6} className="text-ink-300" />
        <span className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-white">
          <Plus size={16} strokeWidth={2.4} />
        </span>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink-900">
          El docente no cuenta con un plan de mejoramiento activo
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-500">
          No hay un plan registrado para el periodo {semester}. Crea uno para hacer
          seguimiento de metas e hitos académicos.
        </p>
      </div>
      <Link
        href="/plans"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <Plus size={14} strokeWidth={2.4} /> Crear Plan de Mejoramiento
      </Link>
    </div>
  )
}

export function TeacherDetailPage() {
  const [selectedSemester, setSelectedSemester] = useState(SEMESTERS[0])

  // Comment filters
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('todos')
  const [riskFilter, setRiskFilter] = useState('todos')
  const [semesterFilter, setSemesterFilter] = useState(SEMESTERS[0])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Cuando cambia el periodo del docente, los comentarios siguen ese semestre.
  // Ajuste de estado durante el render (patrón recomendado por React, sin efecto).
  const [prevSemester, setPrevSemester] = useState(selectedSemester)
  if (selectedSemester !== prevSemester) {
    setPrevSemester(selectedSemester)
    setSemesterFilter(selectedSemester)
  }

  const stats = SEMESTER_STATS[selectedSemester]
  const plan = PLANS[selectedSemester]
  const recurrent = stats.recurrentLowPerformance

  const filtersDirty =
    search !== '' ||
    tagFilter !== 'todos' ||
    riskFilter !== 'todos' ||
    semesterFilter !== selectedSemester

  const filteredComments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return COMMENTS.filter((comment) => {
      if (semesterFilter !== 'todos' && comment.semester !== semesterFilter) return false
      if (riskFilter !== 'todos' && comment.risk !== riskFilter) return false
      if (tagFilter !== 'todos' && comment.tag !== tagFilter) return false
      if (query && !comment.text.toLowerCase().includes(query)) return false
      return true
    })
  }, [search, tagFilter, riskFilter, semesterFilter])

  function clearFilters() {
    setSearch('')
    setTagFilter('todos')
    setRiskFilter('todos')
    setSemesterFilter(selectedSemester)
  }

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const commentColumns: DataTableColumn<TeacherComment>[] = [
    {
      header: 'Comentario del estudiante',
      cellClassName: 'align-top py-4',
      cell: (comment) => {
        const isOpen = expanded.has(comment.id)
        const isLong = comment.text.length > COMMENT_PREVIEW
        const shown =
          isOpen || !isLong
            ? comment.text
            : `${comment.text.slice(0, COMMENT_PREVIEW).trimEnd()}…`
        return (
          <div className="max-w-[460px]">
            <p
              className="text-[13.5px] leading-relaxed text-ink-800"
              style={{ textWrap: 'pretty' }}
            >
              {shown}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => toggleExpanded(comment.id)}
                className="mt-1 text-[12px] font-semibold text-brand-700 transition-colors hover:text-brand-800"
              >
                {isOpen ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )
      },
    },
    {
      header: 'Materia',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="text-[13px] text-ink-700">{comment.subject}</span>
      ),
    },
    {
      header: 'Semestre',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="num inline-flex h-6 items-center rounded-full border border-ink-200 bg-ink-50/60 px-2.5 text-[11px] font-semibold tabular-nums text-ink-700">
          {comment.semester}
        </span>
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
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink-900 wrap-break-words sm:text-[28px]">
                {TEACHER.name}
              </h1>
              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-ink-600">
                <li className="inline-flex items-center gap-2">
                  <Building2 size={14} className="shrink-0 text-ink-400" /> {TEACHER.faculty}
                </li>
                <li className="inline-flex items-center gap-2">
                  <Clock size={14} className="shrink-0 text-ink-400" /> {TEACHER.vinculacion}
                </li>
                <li className="inline-flex items-center gap-2">
                  <Calendar size={14} className="shrink-0 text-ink-400" />
                  <span>Periodo Académico:</span>
                  <Select
                    value={selectedSemester}
                    onChange={setSelectedSemester}
                    options={SEMESTERS}
                    ariaLabel="Periodo académico"
                    className="w-28"
                  />
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 lg:w-[540px] lg:shrink-0">
            <div className="rounded-lg border border-ink-200 bg-ink-50/40 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-ink-500">
                Promedio Global
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="num text-[32px] font-semibold leading-none tabular-nums text-ink-900">
                  {stats.average.toFixed(1)}
                </span>
                <span className="text-[14px] font-medium text-ink-500">/5</span>
              </div>
            </div>
            <div className="flex flex-col rounded-lg border border-ink-200 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Nivel de Riesgo
              </div>
              <div className="mt-3">
                <span
                  className={cn(
                    'inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold',
                    RISK_TONE_CLASS[stats.risk.tone],
                  )}
                >
                  {stats.risk.label}
                </span>
              </div>
            </div>
            <div
              className={cn(
                'rounded-lg border px-4 py-3',
                recurrent
                  ? 'border-amber-200/70 bg-amber-50/50'
                  : 'border-emerald-200/70 bg-emerald-50/50',
              )}
            >
              <div
                className={cn(
                  'inline-flex items-start gap-2 text-[11px] font-semibold leading-snug tracking-[0.04em]',
                  recurrent ? 'text-amber-700' : 'text-emerald-700',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                    recurrent ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                  )}
                >
                  {recurrent ? (
                    <AlertTriangle size={10} strokeWidth={2.6} />
                  ) : (
                    <Check size={10} strokeWidth={3} />
                  )}
                </span>
                <span className="uppercase">
                  Bajo desempeño recurrente: {recurrent ? 'Detectado' : 'No detectado'}
                </span>
              </div>
              <div
                className={cn(
                  'mt-2 text-[10.5px]',
                  recurrent ? 'text-amber-700/70' : 'text-emerald-700/70',
                )}
              >
                * Basado en últimos 4 periodos
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="brand" size="lg">
            <FileText size={15} /> Generar Reporte Detallado
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
            {stats.dimensions.map((dimension) => (
              <li key={dimension.id}>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-700">
                  <span>{dimension.label}</span>
                  <span className="num tabular-nums text-ink-900">
                    {dimension.value}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full bg-brand-600 transition-all duration-700"
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
              data={HISTORY}
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
              Seguimiento de objetivos y hitos académicos para el periodo {selectedSemester}.
            </p>
          </div>
          {plan && (
            <Link
              href="/plans"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:bg-ink-50"
            >
              <Plus size={14} strokeWidth={2} /> Crear Plan de Mejoramiento
            </Link>
          )}
        </div>

        {plan ? (
          <>
            <div className="relative pt-2">
              <div className="absolute left-[16%] right-[16%] top-[34px] h-0.5 rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-700"
                  style={{ width: `${plan.progress}%` }}
                />
              </div>
              <div className="relative grid grid-cols-3 gap-3">
                {plan.steps.map((step) => (
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
              {plan.goals.map((goal) => (
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
          </>
        ) : (
          <EmptyPlanState semester={selectedSemester} />
        )}
      </Card>

      {/* Comments */}
      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 p-5 sm:p-6">
          <div>
            <h2 className="text-[20px] font-semibold text-ink-900">
              Comentarios Detallados
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Análisis automático con clasificación por nivel de riesgo y dimensión.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-xs">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar comentario…"
                icon={<Search size={15} />}
                aria-label="Buscar comentario"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={tagFilter}
                onChange={setTagFilter}
                ariaLabel="Filtrar por categoría"
                className="w-44"
                options={[
                  { value: 'todos', label: 'Todas las categorías' },
                  ...DIMENSION_LABELS.map((label) => ({ value: label, label })),
                ]}
              />
              <Select
                value={riskFilter}
                onChange={setRiskFilter}
                ariaLabel="Filtrar por nivel de riesgo"
                className="w-40"
                options={[
                  { value: 'todos', label: 'Todos los niveles' },
                  { value: 'alto', label: 'Alto' },
                  { value: 'medio', label: 'Medio' },
                  { value: 'bajo', label: 'Bajo' },
                ]}
              />
              <Select
                value={semesterFilter}
                onChange={setSemesterFilter}
                ariaLabel="Filtrar por semestre"
                className="w-44"
                options={[
                  { value: 'todos', label: 'Todos los semestres' },
                  ...SEMESTERS.map((value) => ({ value, label: value })),
                ]}
              />
              <Button
                variant="outline"
                size="md"
                onClick={clearFilters}
                disabled={!filtersDirty}
              >
                <Eraser size={14} /> Limpiar
              </Button>
            </div>
          </div>
        </div>
        <DataTable
          columns={commentColumns}
          rows={filteredComments}
          rowKey={(comment) => comment.id}
          headerVariant="muted"
          minWidth={860}
          emptyMessage="No hay comentarios para este filtro."
        />
      </Card>

      <AppFooter>
        Periodo Académico {selectedSemester} · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  )
}
