import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronRight,
  Clock,
  Filter,
  Minus,
  Plus,
  Search,
  TrendingUp,
  UserSearch,
  X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'wouter'

import {
  TEACHER_STATUS_BADGE,
  TEACHERS,
  VINCULACIONES,
  type Teacher,
  type Trend,
} from '@/entities/teacher'
import { cn } from '@/shared/lib/utils'
import {
  AppFooter,
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  FilterChip,
  Input,
  PageHeader,
  Pagination,
  ScoreBar,
  Select,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

const PAGE_SIZE = 4

const TREND_ICON: Record<Trend, ReactNode> = {
  up: <ArrowUp size={14} className="text-emerald-600" />,
  down: <ArrowDown size={14} className="text-brand-600" />,
  flat: <Minus size={14} className="text-ink-400" />,
}

interface MetricCardProps {
  label: string
  value: string
  icon: ReactNode
  iconBg: string
  iconText: string
  valueColor?: string
  trend?: ReactNode
  footer: ReactNode
}

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  iconText,
  valueColor,
  trend,
  footer,
}: MetricCardProps) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-pop sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="max-w-[70%] text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-ink-500">
          {label}
        </div>
        <div
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
            iconBg,
            iconText,
          )}
        >
          {icon}
        </div>
      </div>
      <div className="num mt-5 text-[44px] font-semibold leading-none tracking-tight">
        <span className={valueColor ?? 'text-ink-900'}>{value}</span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[12px]">
        {trend}
        {footer}
      </div>
    </Card>
  )
}

interface Filters {
  search: string
  periodo: string
  vinc: string
  umbral: string
}

const INITIAL_FILTERS: Filters = {
  search: '',
  periodo: '2024-1',
  vinc: 'todos',
  umbral: 'any',
}

const UMBRAL_LABELS: Record<string, string> = {
  bajo: 'Bajo umbral',
  med: 'Seguimiento',
  alto: 'Óptimo',
}

export function TeachersPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return TEACHERS.filter((teacher) => {
      if (filters.search) {
        const query = filters.search.toLowerCase()
        if (
          !teacher.name.toLowerCase().includes(query) &&
          !teacher.faculty.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (filters.vinc !== 'todos' && teacher.vinculacion !== filters.vinc) {
        return false
      }
      if (filters.umbral === 'bajo' && teacher.score >= 70) return false
      if (filters.umbral === 'med' && (teacher.score < 70 || teacher.score >= 80)) {
        return false
      }
      if (filters.umbral === 'alto' && teacher.score < 80) return false
      return true
    })
  }, [filters])

  // Reset to the first page whenever the filter set changes.
  const [appliedFilters, setAppliedFilters] = useState(filters)
  if (appliedFilters !== filters) {
    setAppliedFilters(filters)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)
  const hasFilters =
    filters.search !== '' || filters.vinc !== 'todos' || filters.umbral !== 'any'

  const columns: DataTableColumn<Teacher>[] = [
    {
      header: 'Nombre del docente',
      cell: (teacher) => (
        <div className="flex items-center gap-3">
          <Avatar name={teacher.name} size={36} paletteIndex={teacher.id} />
          <div className="leading-tight">
            <div className="text-[13.5px] font-medium text-ink-900">
              {teacher.name}
            </div>
            <div className="text-[12px] text-ink-500">{teacher.faculty}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Tipo de Vinculación',
      cell: (teacher) => (
        <Badge
          variant="outline"
          className="text-[12px] font-medium normal-case tracking-normal"
        >
          {teacher.vinculacion}
        </Badge>
      ),
    },
    {
      header: 'Promedio Global',
      cell: (teacher) => <ScoreBar score={teacher.score} />,
    },
    {
      header: 'Estado',
      cell: (teacher) => {
        const badge = TEACHER_STATUS_BADGE[teacher.status]
        return <Badge variant={badge.variant}>{badge.label}</Badge>
      },
    },
    {
      header: 'Tendencia',
      cell: (teacher) => (
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-ink-50">
          {TREND_ICON[teacher.trend]}
        </div>
      ),
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (teacher) => (
        <Link
          href={`/teachers/${teacher.id}`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          Ver Detalles <ChevronRight size={13} />
        </Link>
      ),
    },
  ]

  return (
    <AppLayout
      role="director"
      header={{
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link href="/dashboard" className="transition-colors hover:text-ink-900">
              Docentes
            </Link>
            <ChevronRight size={12} className="text-ink-300" />
            <span className="font-medium text-ink-900">
              Periodo Académico 2024-1
            </span>
          </>
        ),
      }}
    >
      <PageHeader
        title="Gestión de Docentes"
        description="Panel administrativo de evaluación y seguimiento docente para el departamento."
        actions={
          <Link
            href="/upload-teachers"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={14} strokeWidth={2.25} />
            Cargar docentes
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total docentes evaluados"
          value="245"
          icon={<UserSearch size={18} />}
          iconBg="bg-sky-50"
          iconText="text-sky-600"
          trend={
            <Badge variant="success" className="text-[11px]">
              <TrendingUp size={11} /> +5.2%
            </Badge>
          }
          footer={<span className="text-ink-500">vs. periodo anterior</span>}
        />
        <MetricCard
          label="Docentes bajo umbral"
          value="12"
          icon={<AlertTriangle size={18} />}
          iconBg="bg-brand-50"
          iconText="text-brand-600"
          valueColor="text-brand-600"
          footer={<span className="text-ink-500">Acción correctiva requerida</span>}
        />
        <MetricCard
          label="Docentes con plan activo"
          value="08"
          icon={<CheckSquare size={18} />}
          iconBg="bg-amber-50"
          iconText="text-amber-600"
          footer={
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
              <Clock size={12} /> En ejecución
            </span>
          }
        />
      </div>

      {/* Filter bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          <FilterField label="Buscar por nombre">
            <Input
              value={filters.search}
              onChange={(event) =>
                setFilters({ ...filters, search: event.target.value })
              }
              placeholder="Ej: Elena Rodríguez..."
              icon={<Search size={14} />}
            />
          </FilterField>
          <FilterField label="Periodo">
            <Select
              value={filters.periodo}
              onChange={(value) => setFilters({ ...filters, periodo: value })}
              options={['2024-1', '2023-2', '2023-1', '2022-2']}
              ariaLabel="Filtrar por periodo"
            />
          </FilterField>
          <FilterField label="Vinculación">
            <Select
              value={filters.vinc}
              onChange={(value) => setFilters({ ...filters, vinc: value })}
              options={[
                { value: 'todos', label: 'Todos' },
                ...VINCULACIONES.map((item) => ({ value: item, label: item })),
              ]}
              ariaLabel="Filtrar por vinculación"
            />
          </FilterField>
          <FilterField label="Umbral">
            <Select
              value={filters.umbral}
              onChange={(value) => setFilters({ ...filters, umbral: value })}
              options={[
                { value: 'any', label: 'Cualquier puntaje' },
                { value: 'bajo', label: 'Bajo umbral (<70)' },
                { value: 'med', label: 'Seguimiento (70-79)' },
                { value: 'alto', label: 'Óptimo (≥80)' },
              ]}
              ariaLabel="Filtrar por umbral"
            />
          </FilterField>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter size={14} />
              Filtrar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilters(INITIAL_FILTERS)}
              aria-label="Restablecer filtros"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            <span className="mr-1 inline-flex items-center text-[12px] text-ink-500">
              Activos:
            </span>
            {filters.search && (
              <FilterChip onRemove={() => setFilters({ ...filters, search: '' })}>
                Búsqueda: "{filters.search}"
              </FilterChip>
            )}
            {filters.vinc !== 'todos' && (
              <FilterChip onRemove={() => setFilters({ ...filters, vinc: 'todos' })}>
                {filters.vinc}
              </FilterChip>
            )}
            {filters.umbral !== 'any' && (
              <FilterChip onRemove={() => setFilters({ ...filters, umbral: 'any' })}>
                {UMBRAL_LABELS[filters.umbral]}
              </FilterChip>
            )}
            <span className="ml-auto text-[12px] text-ink-500">
              {filtered.length} resultados
            </span>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(teacher) => teacher.id}
          headerVariant="default"
          minWidth={860}
          rowClassName="h-[68px]"
          emptyMessage="Sin resultados para los filtros aplicados."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          summary={
            <span className="uppercase tracking-[0.06em]">
              Mostrando{' '}
              <span className="font-semibold text-ink-700">{pageRows.length}</span>{' '}
              de <span className="font-semibold text-ink-700">{filtered.length}</span>{' '}
              docentes
            </span>
          }
        />
      </Card>

      <AppFooter>
        Periodo Académico 2024-1 · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        {label}
      </label>
      {children}
    </div>
  )
}
