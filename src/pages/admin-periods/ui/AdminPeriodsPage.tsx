import {
  AlertTriangle,
  Archive,
  Check,
  ChevronDown,
  Pencil,
  Play,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { daysBetween, formatDateEs } from '@/shared/lib/format'
import { useToast } from '@/shared/lib/use-toast'
import { cn } from '@/shared/lib/utils'
import {
  AdminViewBadge,
  AppFooter,
  Button,
  Card,
  FilterPills,
  Input,
  PageHeader,
  StatTile,
  Toast,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

const TODAY = '2024-05-17'

type PeriodStatus = 'proximo' | 'activo' | 'evaluacion' | 'cerrado'

interface AcademicPeriod {
  id: string
  codigo: string
  nombre: string
  start: string
  end: string
  evalStart: string
  evalEnd: string
  status: PeriodStatus
  enrolled: number
}

const STATUS: Record<
  PeriodStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  proximo: { label: 'Próximo', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/70', dot: 'bg-sky-500' },
  activo: { label: 'Activo', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70', dot: 'bg-emerald-500' },
  evaluacion: { label: 'En evaluación', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70', dot: 'bg-amber-500' },
  cerrado: { label: 'Cerrado', bg: 'bg-ink-100', text: 'text-ink-600', border: 'border-ink-200', dot: 'bg-ink-400' },
}

const INITIAL_PERIODS: AcademicPeriod[] = [
  { id: '2024-2', codigo: '2024-2', nombre: 'Semestre 2024-2', start: '2024-08-05', end: '2024-12-15', evalStart: '2024-11-18', evalEnd: '2024-12-08', status: 'proximo', enrolled: 0 },
  { id: '2024-1', codigo: '2024-1', nombre: 'Semestre 2024-1', start: '2024-01-29', end: '2024-06-09', evalStart: '2024-05-13', evalEnd: '2024-06-02', status: 'evaluacion', enrolled: 245 },
  { id: '2023-2', codigo: '2023-2', nombre: 'Semestre 2023-2', start: '2023-08-07', end: '2023-12-17', evalStart: '2023-11-20', evalEnd: '2023-12-10', status: 'cerrado', enrolled: 238 },
  { id: '2023-1', codigo: '2023-1', nombre: 'Semestre 2023-1', start: '2023-01-30', end: '2023-06-11', evalStart: '2023-05-15', evalEnd: '2023-06-04', status: 'cerrado', enrolled: 232 },
]

const daysUntil = (iso: string) =>
  Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(TODAY).getTime()) / 86_400_000)

function ActivePeriodHero({ period }: { period: AcademicPeriod | undefined }) {
  if (!period) return null
  const total = daysBetween(period.start, period.end)
  const passed = Math.max(0, daysBetween(period.start, TODAY))
  const progress = Math.min(100, Math.max(0, (passed / total) * 100))

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-ink-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 text-[11px] font-semibold uppercase text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Periodo activo
          </span>
          <h2 className="text-[20px] font-semibold text-ink-900">
            {period.nombre}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            Evaluación termina en
          </div>
          <div className="num mt-1 text-[20px] font-semibold leading-none tabular-nums text-brand-600">
            {daysUntil(period.evalEnd)} días
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
            <span>Avance del periodo</span>
            <span className="num tabular-nums text-ink-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="absolute inset-y-0 left-0 bg-brand-600 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute inset-y-0 bg-amber-400/40"
              style={{
                left: `${(daysBetween(period.start, period.evalStart) / total) * 100}%`,
                width: `${(daysBetween(period.evalStart, period.evalEnd) / total) * 100}%`,
              }}
            />
          </div>
          <div className="num mt-2 flex justify-between text-[11px] tabular-nums text-ink-500">
            <span>{formatDateEs(period.start)}</span>
            <span className="font-semibold text-amber-700">
              {formatDateEs(period.evalStart)} → {formatDateEs(period.evalEnd)}
            </span>
            <span>{formatDateEs(period.end)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-ink-200 bg-ink-50/40 px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Docentes
            </div>
            <div className="num mt-2 text-[22px] font-semibold leading-none tabular-nums text-ink-900">
              {period.enrolled}
            </div>
          </div>
          <div className="rounded-lg border border-ink-200 bg-ink-50/40 px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Duración
            </div>
            <div className="num mt-2 text-[22px] font-semibold leading-none tabular-nums text-ink-900">
              {total}
              <span className="ml-1 text-[12px] font-medium text-ink-500">
                días
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface PeriodForm {
  codigo: string
  nombre: string
  start: string
  end: string
  evalStart: string
  evalEnd: string
}

const EMPTY_FORM: PeriodForm = {
  codigo: '',
  nombre: '',
  start: '',
  end: '',
  evalStart: '',
  evalEnd: '',
}

function NewPeriodCard({
  onCreate,
}: {
  onCreate: (period: AcademicPeriod) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PeriodForm>(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => {
    const result: Partial<Record<keyof PeriodForm, string>> = {}
    if (!form.codigo) result.codigo = 'Código requerido'
    else if (!/^\d{4}-[12]$/.test(form.codigo)) {
      result.codigo = 'Formato: AAAA-1 o AAAA-2'
    }
    if (!form.nombre) result.nombre = 'Nombre requerido'
    if (!form.start) result.start = 'Fecha inicio requerida'
    if (!form.end) result.end = 'Fecha cierre requerida'
    if (form.start && form.end && new Date(form.end) <= new Date(form.start)) {
      result.end = 'Debe ser posterior al inicio'
    }
    if (
      form.evalStart &&
      form.evalEnd &&
      new Date(form.evalEnd) <= new Date(form.evalStart)
    ) {
      result.evalEnd = 'Cierre de evaluación inválido'
    }
    return result
  }, [form])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return
    onCreate({
      id: form.codigo,
      codigo: form.codigo,
      nombre: form.nombre,
      start: form.start,
      end: form.end,
      evalStart: form.evalStart,
      evalEnd: form.evalEnd,
      status: 'proximo',
      enrolled: 0,
    })
    setForm(EMPTY_FORM)
    setSubmitted(false)
    setOpen(false)
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-ink-50/40 sm:px-6"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <Check size={16} strokeWidth={2.25} />
          </span>
          <div>
            <div className="text-[15px] font-semibold text-ink-900">
              Configurar nuevo periodo académico
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-500">
              Define fechas, ventana de evaluación y estado inicial.
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn('text-ink-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-ink-100 px-5 pb-6 pt-2 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PeriodField label="Código del periodo" required error={submitted ? errors.codigo : undefined} help="Formato AAAA-1 o AAAA-2">
              <Input
                value={form.codigo}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codigo: event.target.value,
                    nombre: event.target.value
                      ? `Semestre ${event.target.value}`
                      : '',
                  })
                }
                placeholder="2025-1"
              />
            </PeriodField>
            <PeriodField label="Nombre" required error={submitted ? errors.nombre : undefined}>
              <Input
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                placeholder="Semestre 2025-1"
              />
            </PeriodField>
            <PeriodField label="Fecha de inicio" required error={submitted ? errors.start : undefined}>
              <Input
                type="date"
                value={form.start}
                onChange={(event) => setForm({ ...form, start: event.target.value })}
              />
            </PeriodField>
            <PeriodField label="Fecha de cierre" required error={submitted ? errors.end : undefined}>
              <Input
                type="date"
                value={form.end}
                onChange={(event) => setForm({ ...form, end: event.target.value })}
              />
            </PeriodField>

            <div className="mt-2 border-t border-ink-100 pt-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-700">
                  Ventana de evaluación
                </span>
              </div>
            </div>

            <PeriodField label="Apertura de evaluación" help="Día en que los estudiantes pueden empezar">
              <Input
                type="date"
                value={form.evalStart}
                onChange={(event) =>
                  setForm({ ...form, evalStart: event.target.value })
                }
              />
            </PeriodField>
            <PeriodField label="Cierre de evaluación" error={submitted ? errors.evalEnd : undefined} help="Último día para responder">
              <Input
                type="date"
                value={form.evalEnd}
                onChange={(event) => setForm({ ...form, evalEnd: event.target.value })}
              />
            </PeriodField>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 border-t border-ink-100 pt-4 sm:flex-row sm:items-center">
            <p className="text-[12px] text-ink-500">
              El periodo se creará en estado{' '}
              <span className="font-semibold text-sky-700">Próximo</span>. Podrá
              activarlo desde la tabla cuando esté listo.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(EMPTY_FORM)
                  setSubmitted(false)
                  setOpen(false)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="brand">
                <Check size={14} strokeWidth={2} />
                Crear periodo
              </Button>
            </div>
          </div>
        </form>
      )}
    </Card>
  )
}

function PeriodField({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-600">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </label>
      {children}
      {error ? (
        <div className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-brand-600">
          <AlertTriangle size={11} /> {error}
        </div>
      ) : (
        help && <div className="mt-1.5 text-[11px] text-ink-400">{help}</div>
      )}
    </div>
  )
}

export function AdminPeriodsPage() {
  const [periods, setPeriods] = useState<AcademicPeriod[]>(INITIAL_PERIODS)
  const [statusFilter, setStatusFilter] = useState('todos')
  const { toast, showToast } = useToast()

  const activePeriod = periods.find(
    (period) => period.status === 'activo' || period.status === 'evaluacion',
  )

  const counts = useMemo(() => {
    const result = { active: 0, upcoming: 0, closed: 0 }
    for (const period of periods) {
      if (period.status === 'activo' || period.status === 'evaluacion') {
        result.active++
      } else if (period.status === 'proximo') result.upcoming++
      else result.closed++
    }
    return result
  }, [periods])

  const visiblePeriods =
    statusFilter === 'todos'
      ? periods
      : periods.filter((period) => period.status === statusFilter)

  const handleCreate = (period: AcademicPeriod) => {
    setPeriods((prev) => [period, ...prev])
    showToast(`Periodo ${period.codigo} creado correctamente`)
  }
  const activate = (id: string) => {
    setPeriods((prev) =>
      prev.map((period) =>
        period.id === id ? { ...period, status: 'activo' } : period,
      ),
    )
    showToast(`Periodo ${id} activado`)
  }
  const close = (id: string) => {
    setPeriods((prev) =>
      prev.map((period) =>
        period.id === id ? { ...period, status: 'cerrado' } : period,
      ),
    )
    showToast(`Periodo ${id} cerrado`, 'warning')
  }

  return (
    <AppLayout
      header={{
        userName: 'Super Administrador',
        userRole: 'División de Sistemas',
      }}
    >
      <PageHeader
        badge={<AdminViewBadge />}
        title="Periodos Académicos"
        description="Configure semestres, defina ventanas de evaluación y gestione el ciclo de vida de cada periodo institucional."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total registrados" value={periods.length} />
        <StatTile
          label="Activos / Evaluación"
          value={counts.active}
          valueClassName="text-emerald-700"
        />
        <StatTile
          label="Próximos"
          value={counts.upcoming}
          valueClassName="text-sky-700"
        />
        <StatTile label="Cerrados" value={counts.closed} />
      </div>

      <ActivePeriodHero period={activePeriod} />

      <NewPeriodCard onCreate={handleCreate} />

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-[16px] font-semibold text-ink-900">
              Periodos académicos
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Total:{' '}
              <span className="num font-semibold text-ink-800">
                {periods.length}
              </span>{' '}
              periodos · {counts.active + counts.upcoming} activos o por iniciar
            </p>
          </div>
          <FilterPills
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'activo', label: 'Activos' },
              { value: 'evaluacion', label: 'Evaluación' },
              { value: 'proximo', label: 'Próximos' },
              { value: 'cerrado', label: 'Cerrados' },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/60 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                <th className="px-6 py-3 text-left font-semibold">Periodo</th>
                <th className="py-3 pr-6 text-left font-semibold">
                  Inicio – Cierre
                </th>
                <th className="py-3 pr-6 text-left font-semibold">
                  Ventana evaluación
                </th>
                <th className="py-3 pr-6 text-left font-semibold">Docentes</th>
                <th className="py-3 pr-6 text-left font-semibold">Estado</th>
                <th className="py-3 pr-6 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visiblePeriods.map((period) => {
                const status = STATUS[period.status]
                return (
                  <tr
                    key={period.id}
                    className="h-[68px] border-b border-ink-100 transition-colors last:border-b-0 hover:bg-ink-50/40"
                  >
                    <td className="px-6">
                      <div className="num text-[14px] font-semibold tabular-nums text-ink-900">
                        {period.codigo}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-ink-500">
                        {period.nombre}
                      </div>
                    </td>
                    <td className="whitespace-nowrap pr-6 text-[13px] text-ink-700">
                      <div className="font-medium text-ink-900">
                        {formatDateEs(period.start)}
                      </div>
                      <div className="text-ink-500">
                        al {formatDateEs(period.end)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap pr-6 text-[13px]">
                      <div className="font-medium text-ink-900">
                        {formatDateEs(period.evalStart)} →{' '}
                        {formatDateEs(period.evalEnd)}
                      </div>
                      <div className="mt-0.5 text-ink-500">
                        {daysBetween(period.evalStart, period.evalEnd)} días de
                        ventana
                      </div>
                    </td>
                    <td className="num pr-6 text-[13.5px] font-medium tabular-nums text-ink-800">
                      {period.enrolled}
                    </td>
                    <td className="pr-6">
                      <span
                        className={cn(
                          'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.04em]',
                          status.bg,
                          status.text,
                          status.border,
                        )}
                      >
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full', status.dot)}
                        />
                        {status.label}
                      </span>
                    </td>
                    <td className="pr-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {period.status === 'proximo' && (
                          <Button
                            variant="brand"
                            size="sm"
                            onClick={() => activate(period.id)}
                          >
                            <Play size={11} fill="currentColor" strokeWidth={0} />
                            Activar
                          </Button>
                        )}
                        {(period.status === 'activo' ||
                          period.status === 'evaluacion') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => close(period.id)}
                          >
                            <Archive size={12} />
                            Cerrar
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              `Editar periodo ${period.codigo} (próximamente)`,
                              'info',
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 bg-card text-ink-700 hover:bg-ink-50"
                          aria-label={`Editar ${period.codigo}`}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visiblePeriods.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-[13px] text-ink-500"
                  >
                    Sin periodos para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AppFooter>Periodos Académicos · Super Admin · v2.1</AppFooter>
      <Toast toast={toast} />
    </AppLayout>
  )
}
