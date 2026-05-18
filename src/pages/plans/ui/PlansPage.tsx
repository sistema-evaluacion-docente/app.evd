import { MoreHorizontal, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { TEACHERS } from '@/entities/teacher'
import { cn } from '@/shared/lib/utils'
import {
  AppFooter,
  Avatar,
  Button,
  Card,
  DataTable,
  FilterPills,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

type PlanStatus = 'proceso' | 'completado' | 'pendiente' | 'vencido'

interface ImprovementPlan {
  id: number
  name: string
  faculty: string
  title: string
  description: string
  start: string
  end: string
  progress: number
  status: PlanStatus
}

const PLAN_STATUS: Record<
  PlanStatus,
  { label: string; bar: string; text: string; bg: string; border: string }
> = {
  proceso: { label: 'En Proceso', bar: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200/70' },
  completado: { label: 'Completado', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/70' },
  pendiente: { label: 'Pendiente', bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200/70' },
  vencido: { label: 'Vencido', bar: 'bg-brand-600', text: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200/70' },
}

const BASE_PLANS: ImprovementPlan[] = [
  { id: 1, name: 'Dra. Elena Ramírez', faculty: 'Facultad de Ciencias', title: 'Fortalecimiento en Metodologías Activas', description: 'Implementación de aprendizaje basado en proyectos.', start: '01 Sep 2023', end: '30 Nov 2023', progress: 65, status: 'proceso' },
  { id: 2, name: 'Mg. Carlos Vives', faculty: 'Facultad de Ingeniería', title: 'Actualización en Evaluación por Competencias', description: 'Diseño de rúbricas para laboratorios prácticos.', start: '15 Jun 2023', end: '15 Ago 2023', progress: 100, status: 'completado' },
  { id: 3, name: 'Dra. Ana López', faculty: 'Facultad de Humanidades', title: 'Uso de Herramientas Digitales (LMS)', description: 'Curso intensivo de Moodle avanzado.', start: '10 Oct 2023', end: '10 Dic 2023', progress: 15, status: 'pendiente' },
  { id: 4, name: 'Dr. Juan Martínez', faculty: 'Facultad de Derecho', title: 'Mejora en Resultados de Evaluación Docente', description: 'Tutorías sobre clima de aula.', start: '01 Feb 2023', end: '30 Mar 2023', progress: 40, status: 'vencido' },
  { id: 5, name: 'Ing. Patricia Salgado', faculty: 'Facultad de Ingeniería', title: 'Innovación Pedagógica con IA', description: 'Integración de asistentes inteligentes al aula.', start: '05 Ago 2023', end: '20 Dic 2023', progress: 48, status: 'proceso' },
  { id: 6, name: 'Dr. Sebastián Vélez', faculty: 'Ciencias Económicas', title: 'Refuerzo en Comunicación Académica', description: 'Talleres de oratoria y feedback efectivo.', start: '12 Sep 2023', end: '12 Dic 2023', progress: 30, status: 'proceso' },
  { id: 7, name: 'Lic. Daniela Ospina', faculty: 'Artes y Humanidades', title: 'Plan de Recuperación Docente', description: 'Acompañamiento intensivo con par pedagógico.', start: '20 Mar 2023', end: '20 May 2023', progress: 100, status: 'completado' },
  { id: 8, name: 'Lic. Tomás Aristizábal', faculty: 'Facultad de Derecho', title: 'Plan de Acción Disciplinar', description: 'Revisión de prácticas evaluativas.', start: '10 Ene 2023', end: '10 Mar 2023', progress: 20, status: 'vencido' },
]

const ALL_PLANS: ImprovementPlan[] = Array.from({ length: 24 }, (_, index) => ({
  ...BASE_PLANS[index % BASE_PLANS.length],
  id: index + 1,
}))

const PAGE_SIZE = 4

export function PlansPage() {
  const [statusFilter, setStatusFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const counts = useMemo(() => {
    const result: Record<string, number> = { todos: ALL_PLANS.length }
    for (const plan of ALL_PLANS) {
      result[plan.status] = (result[plan.status] ?? 0) + 1
    }
    return result
  }, [])

  const filtered = useMemo(() => {
    return ALL_PLANS.filter((plan) => {
      if (statusFilter !== 'todos' && plan.status !== statusFilter) return false
      if (search) {
        const query = search.toLowerCase()
        if (
          !plan.name.toLowerCase().includes(query) &&
          !plan.title.toLowerCase().includes(query) &&
          !plan.faculty.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [statusFilter, search])

  // Reset to the first page whenever a filter changes.
  const filterKey = `${statusFilter}|${search}`
  const [appliedKey, setAppliedKey] = useState(filterKey)
  if (appliedKey !== filterKey) {
    setAppliedKey(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)

  const columns: DataTableColumn<ImprovementPlan>[] = [
    {
      header: 'Docente',
      cellClassName: 'py-5 align-top',
      cell: (plan) => (
        <div className="flex items-start gap-3">
          <Avatar name={plan.name} size={40} paletteIndex={plan.id} />
          <div className="pt-0.5 leading-tight">
            <div className="text-[14px] font-semibold text-ink-900">
              {plan.name}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-500">{plan.faculty}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Plan de Mejoramiento',
      cellClassName: 'py-5 align-top max-w-[420px]',
      cell: (plan) => (
        <>
          <div className="text-[14px] font-semibold leading-snug text-ink-900">
            {plan.title}
          </div>
          <div
            className="mt-1 text-[12.5px] leading-snug text-ink-500"
            style={{ textWrap: 'pretty' }}
          >
            {plan.description}
          </div>
        </>
      ),
    },
    {
      header: 'Fechas',
      cellClassName: 'py-5 align-top whitespace-nowrap',
      cell: (plan) => {
        const overdue = plan.status === 'vencido'
        return (
          <>
            <div
              className={cn(
                'text-[13.5px] font-medium',
                overdue ? 'text-brand-700' : 'text-ink-900',
              )}
            >
              {plan.start}
            </div>
            <div
              className={cn(
                'mt-0.5 text-[12.5px]',
                overdue ? 'text-brand-600' : 'text-ink-500',
              )}
            >
              al {plan.end}
            </div>
          </>
        )
      },
    },
    {
      header: 'Progreso',
      cellClassName: 'py-5 align-top min-w-[160px]',
      cell: (plan) => {
        const status = PLAN_STATUS[plan.status]
        return (
          <>
            <div className="mb-1.5">
              <span
                className={cn(
                  'num text-[13px] font-semibold tabular-nums',
                  status.text,
                )}
              >
                {plan.progress}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn('h-full transition-all duration-500', status.bar)}
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </>
        )
      },
    },
    {
      header: 'Estado',
      cellClassName: 'py-5 align-top',
      cell: (plan) => {
        const status = PLAN_STATUS[plan.status]
        return (
          <span
            className={cn(
              'inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border px-3 text-[12px] font-semibold',
              status.bg,
              status.text,
              status.border,
            )}
          >
            {status.label}
          </span>
        )
      },
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      cellClassName: 'py-5 align-top text-right',
      cell: (plan) => (
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          aria-label={`Acciones para ${plan.name}`}
        >
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ]

  return (
    <AppLayout role="director">
      <PageHeader
        title="Planes de Mejoramiento"
        description="Seguimiento y gestión de compromisos académicos para el fortalecimiento docente."
        actions={
          <Button variant="brand" size="lg" onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={2.25} />
            Crear Nuevo Plan
          </Button>
        }
      />

      <Card className="p-2 sm:p-3">
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:gap-3">
          <div className="min-w-0 flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar docentes o planes..."
              icon={<Search size={14} />}
              className="h-11 rounded-lg text-[14px]"
            />
          </div>
          <FilterPills
            size="lg"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'todos', label: 'Todos', count: counts.todos },
              { value: 'proceso', label: 'En Proceso', count: counts.proceso },
              { value: 'completado', label: 'Completados', count: counts.completado },
              { value: 'pendiente', label: 'Pendientes', count: counts.pendiente },
              { value: 'vencido', label: 'Vencidos', count: counts.vencido },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(plan) => plan.id}
          headerVariant="muted"
          minWidth={960}
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          summary={
            <>
              Mostrando{' '}
              <span className="font-semibold text-ink-900">
                {filtered.length === 0 ? 0 : start + 1}
              </span>{' '}
              a{' '}
              <span className="font-semibold text-ink-900">
                {Math.min(start + PAGE_SIZE, filtered.length)}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-ink-900">{filtered.length}</span>{' '}
              resultados
            </>
          }
        />
      </Card>

      <AppFooter>
        Periodo Académico 2024-1 · Sistema de Evaluación Docente · v2.1
      </AppFooter>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-6">
          <div>
            <h3 className="text-[18px] font-semibold text-ink-900">
              Crear Nuevo Plan
            </h3>
            <p className="mt-1 text-[13px] text-ink-500">
              Asigne un plan de mejoramiento a un docente del departamento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        <form
          className="space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            setCreateOpen(false)
          }}
        >
          <Field label="Docente">
            <Select
              value=""
              onChange={() => {}}
              options={[
                { value: '', label: 'Seleccione un docente...' },
                ...TEACHERS.slice(0, 8).map((teacher) => ({
                  value: String(teacher.id),
                  label: teacher.name,
                })),
              ]}
            />
          </Field>
          <Field label="Título del plan">
            <Input placeholder="Ej. Fortalecimiento en metodologías activas" />
          </Field>
          <Field label="Descripción">
            <textarea
              rows={3}
              placeholder="Acciones, objetivos y compromisos..."
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicio">
              <Input type="date" />
            </Field>
            <Field label="Fecha cierre">
              <Input type="date" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand">
              Crear Plan
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-600">
        {label}
      </label>
      {children}
    </div>
  )
}
