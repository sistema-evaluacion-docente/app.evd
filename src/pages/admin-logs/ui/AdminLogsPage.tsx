import { ArrowRight, ArrowUpDown, ChevronDown, Download, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { formatDateTimeEs } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import {
  AdminViewBadge,
  AppFooter,
  Avatar,
  Button,
  Card,
  DataTable,
  FilterChip,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatTile,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

type LogAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'IMPORT'
  | 'EXPORT'

interface SystemLog {
  id: number
  user: string
  userRole: 'Super Admin' | 'Director' | 'Docente'
  entity: string
  action: LogAction
  date: string
  detail: string
}

const ACTIONS: Record<
  LogAction,
  { label: string; bg: string; text: string; border: string }
> = {
  CREATE: { label: 'Crear', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70' },
  UPDATE: { label: 'Actualizar', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/70' },
  DELETE: { label: 'Eliminar', bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-100' },
  LOGIN: { label: 'Inicio sesión', bg: 'bg-ink-100', text: 'text-ink-700', border: 'border-ink-200' },
  LOGOUT: { label: 'Cierre sesión', bg: 'bg-ink-100', text: 'text-ink-700', border: 'border-ink-200' },
  IMPORT: { label: 'Importar', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200/70' },
  EXPORT: { label: 'Exportar', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70' },
}

const LOGS: SystemLog[] = [
  { id: 1024, user: 'Director Depto.', userRole: 'Director', entity: 'Docente · DOC-2031', action: 'CREATE', date: '2024-05-17T14:32:45', detail: 'Creación de docente Dra. Elena Ramírez' },
  { id: 1023, user: 'Super Admin', userRole: 'Super Admin', entity: 'Director · DIR-1024', action: 'CREATE', date: '2024-05-17T14:18:11', detail: 'Alta de director Dra. Marta Hernández' },
  { id: 1022, user: 'Director Depto.', userRole: 'Director', entity: 'Plan · PLN-088', action: 'UPDATE', date: '2024-05-17T13:55:02', detail: 'Progreso actualizado de 30% a 45%' },
  { id: 1021, user: 'Dr. Roberto Jiménez', userRole: 'Docente', entity: 'Sesión', action: 'LOGIN', date: '2024-05-17T13:40:23', detail: 'Acceso desde 190.85.221.13' },
  { id: 1020, user: 'Director Depto.', userRole: 'Director', entity: 'Docente · DOC-1907', action: 'DELETE', date: '2024-05-17T12:11:09', detail: 'Baja de docente Ing. Carlos Pineda' },
  { id: 1019, user: 'Super Admin', userRole: 'Super Admin', entity: 'CSV · plantilla_dirs.csv', action: 'IMPORT', date: '2024-05-17T11:48:50', detail: 'Importación masiva: 12 directores válidos, 1 con error' },
  { id: 1018, user: 'Director Depto.', userRole: 'Director', entity: 'Reporte · 2024-1', action: 'EXPORT', date: '2024-05-17T11:02:37', detail: 'Exportación PDF del periodo 2024-1' },
  { id: 1017, user: 'Dra. Patricia Salgado', userRole: 'Docente', entity: 'Sesión', action: 'LOGOUT', date: '2024-05-17T10:30:14', detail: 'Cierre de sesión voluntario' },
  { id: 1016, user: 'Director Depto.', userRole: 'Director', entity: 'Docente · DOC-2018', action: 'UPDATE', date: '2024-05-17T10:18:00', detail: 'Vinculación cambiada a Tiempo Completo' },
  { id: 1015, user: 'Super Admin', userRole: 'Super Admin', entity: 'Director · DIR-1019', action: 'UPDATE', date: '2024-05-17T09:55:42', detail: 'Reasignación de facultad' },
  { id: 1014, user: 'Director Depto.', userRole: 'Director', entity: 'Docente · DOC-2014', action: 'CREATE', date: '2024-05-17T09:20:18', detail: 'Creación manual de docente' },
  { id: 1013, user: 'Dr. Sebastián Vélez', userRole: 'Docente', entity: 'Sesión', action: 'LOGIN', date: '2024-05-17T09:05:11', detail: 'Acceso desde 181.62.144.7' },
  { id: 1012, user: 'Director Depto.', userRole: 'Director', entity: 'Plan · PLN-074', action: 'CREATE', date: '2024-05-17T08:42:39', detail: 'Nuevo plan: Fortalecimiento en Metodologías Activas' },
  { id: 1011, user: 'Director Depto.', userRole: 'Director', entity: 'Evaluación PDF · 2024-1', action: 'IMPORT', date: '2024-05-17T08:10:55', detail: 'Carga del archivo institucional Q1 2024' },
  { id: 1010, user: 'Super Admin', userRole: 'Super Admin', entity: 'Sistema', action: 'UPDATE', date: '2024-05-16T19:34:21', detail: 'Rotación de claves de cifrado' },
  { id: 1009, user: 'Director Depto.', userRole: 'Director', entity: 'Docente · DOC-1988', action: 'DELETE', date: '2024-05-16T17:21:48', detail: 'Baja por finalización de contrato' },
  { id: 1008, user: 'Dra. Lina Castro', userRole: 'Director', entity: 'Sesión', action: 'LOGIN', date: '2024-05-16T16:55:30', detail: 'Acceso desde 200.118.45.92' },
  { id: 1007, user: 'Director Depto.', userRole: 'Director', entity: 'Plan · PLN-061', action: 'UPDATE', date: '2024-05-16T15:30:11', detail: 'Fecha de cierre extendida 15 días' },
  { id: 1006, user: 'Director Depto.', userRole: 'Director', entity: 'Reporte · Docente DOC-2014', action: 'EXPORT', date: '2024-05-16T14:25:00', detail: 'Reporte individual exportado' },
  { id: 1005, user: 'Super Admin', userRole: 'Super Admin', entity: 'Director · DIR-1017', action: 'DELETE', date: '2024-05-16T13:48:09', detail: 'Baja administrativa por traslado' },
]

const DATE_RANGE_LABELS: Record<string, string> = {
  hoy: 'Hoy',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  mes: 'Este mes',
}

const PAGE_SIZE = 10

type SortKey = 'id' | 'user' | 'action' | 'date'

export function AdminLogsPage() {
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('todas')
  const [roleFilter, setRoleFilter] = useState('todos')
  const [dateRange, setDateRange] = useState('todo')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const rangeCutoff = useMemo(() => {
    const now = new Date(LOGS[0].date)
    if (dateRange === 'hoy') {
      const date = new Date(now)
      date.setHours(0, 0, 0, 0)
      return date
    }
    if (dateRange === '7d') {
      const date = new Date(now)
      date.setDate(date.getDate() - 7)
      return date
    }
    if (dateRange === '30d') {
      const date = new Date(now)
      date.setDate(date.getDate() - 30)
      return date
    }
    if (dateRange === 'mes') {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    return null
  }, [dateRange])

  const filtered = useMemo(() => {
    return LOGS.filter((log) => {
      if (query) {
        const search = query.toLowerCase()
        const hit = [log.user, log.entity, log.detail, log.action, String(log.id)]
          .some((value) => value.toLowerCase().includes(search))
        if (!hit) return false
      }
      if (actionFilter !== 'todas' && log.action !== actionFilter) return false
      if (roleFilter !== 'todos' && log.userRole !== roleFilter) return false
      if (rangeCutoff && new Date(log.date) < rangeCutoff) return false
      return true
    }).sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction
      }
      if (sortKey === 'id') return (a.id - b.id) * direction
      if (sortKey === 'user') return a.user.localeCompare(b.user) * direction
      return a.action.localeCompare(b.action) * direction
    })
  }, [query, actionFilter, roleFilter, rangeCutoff, sortKey, sortDir])

  // Reset to the first page whenever a filter changes.
  const filterKey = `${query}|${actionFilter}|${roleFilter}|${dateRange}`
  const [appliedKey, setAppliedKey] = useState(filterKey)
  if (appliedKey !== filterKey) {
    setAppliedKey(filterKey)
    setPage(1)
  }

  const counts = useMemo(() => {
    const result: Partial<Record<LogAction, number>> = {}
    for (const log of filtered) {
      result[log.action] = (result[log.action] ?? 0) + 1
    }
    return result
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)

  const hasActiveFilters =
    query !== '' ||
    actionFilter !== 'todas' ||
    roleFilter !== 'todos' ||
    dateRange !== 'todo'

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const clearFilters = () => {
    setQuery('')
    setActionFilter('todas')
    setRoleFilter('todos')
    setDateRange('todo')
  }

  const exportCsv = () => {
    const header = 'id,usuario,rol,entidad,accion,fecha,detalle\n'
    const body = filtered
      .map((log) =>
        [
          log.id,
          log.user,
          log.userRole,
          log.entity,
          log.action,
          log.date,
          `"${log.detail.replace(/"/g, '""')}"`,
        ].join(','),
      )
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'logs_sistema.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const sortHeader = (label: React.ReactNode, key: SortKey) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1 uppercase tracking-[0.08em]"
    >
      {label}
      <ArrowUpDown
        size={11}
        className={cn('opacity-60', sortKey === key && 'opacity-100')}
      />
    </button>
  )

  const columns: DataTableColumn<SystemLog>[] = [
    {
      header: sortHeader('#', 'id'),
      headerClassName: 'w-14',
      cell: (log) => (
        <span className="num text-[12.5px] tabular-nums text-ink-500">
          {String(log.id).padStart(4, '0')}
        </span>
      ),
    },
    {
      header: sortHeader('Usuario', 'user'),
      cell: (log) => (
        <div className="flex items-center gap-3">
          <Avatar name={log.user} size={32} />
          <div className="leading-tight">
            <div className="text-[13.5px] font-semibold text-ink-900">
              {log.user}
            </div>
            <div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-500">
              {log.userRole}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Entidad afectada',
      cell: (log) => (
        <span className="text-[13px] font-medium text-ink-800">{log.entity}</span>
      ),
    },
    {
      header: sortHeader('Acción', 'action'),
      cell: (log) => {
        const action = ACTIONS[log.action]
        return (
          <span
            className={cn(
              'inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]',
              action.bg,
              action.text,
              action.border,
            )}
          >
            {action.label}
          </span>
        )
      },
    },
    {
      header: sortHeader(
        <>
          Fecha <span className="font-mono normal-case">(LocalDateTime)</span>
        </>,
        'date',
      ),
      cell: (log) => {
        const formatted = formatDateTimeEs(log.date)
        return (
          <div className="whitespace-nowrap" title={formatted.iso}>
            <div className="text-[13px] font-medium text-ink-900">
              {formatted.date}
            </div>
            <div className="num text-[11.5px] tabular-nums text-ink-500">
              {formatted.time}
            </div>
          </div>
        )
      },
    },
    {
      header: '',
      headerClassName: 'w-20',
      cellClassName: 'text-right',
      cell: (log) => (
        <button
          type="button"
          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          aria-label={expandedId === log.id ? 'Ocultar detalle' : 'Ver detalle'}
          aria-expanded={expandedId === log.id}
        >
          <ChevronDown
            size={14}
            className={cn(
              'transition-transform',
              expandedId === log.id && 'rotate-180',
            )}
          />
        </button>
      ),
    },
  ]

  return (
    <AppLayout
      role="admin"
      header={{
        userName: 'Super Administrador',
        userRole: 'División de Sistemas',
      }}
    >
      <PageHeader
        badge={<AdminViewBadge />}
        title="Logs del Sistema"
        description="Registro completo de actividades realizadas en la plataforma para auditoría y trazabilidad."
        actions={
          <Button variant="outline" size="lg" onClick={exportCsv}>
            <Download size={15} />
            Exportar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total registros" value={filtered.length} />
        <StatTile
          label="Creaciones"
          value={counts.CREATE ?? 0}
          valueClassName="text-emerald-700"
        />
        <StatTile
          label="Eliminaciones"
          value={counts.DELETE ?? 0}
          valueClassName="text-brand-700"
        />
        <StatTile
          label="Sesiones"
          value={(counts.LOGIN ?? 0) + (counts.LOGOUT ?? 0)}
        />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por usuario, entidad, ID o detalle..."
            icon={<Search size={14} />}
            className="h-10"
          />
          <Select
            value={actionFilter}
            onChange={setActionFilter}
            ariaLabel="Filtrar por acción"
            options={[
              { value: 'todas', label: 'Todas las acciones' },
              ...Object.entries(ACTIONS).map(([key, value]) => ({
                value: key,
                label: value.label,
              })),
            ]}
          />
          <Select
            value={dateRange}
            onChange={setDateRange}
            ariaLabel="Filtrar por fecha"
            options={[
              { value: 'todo', label: 'Todas las fechas' },
              { value: 'hoy', label: 'Hoy' },
              { value: '7d', label: 'Últimos 7 días' },
              { value: '30d', label: 'Últimos 30 días' },
              { value: 'mes', label: 'Este mes' },
            ]}
          />
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            ariaLabel="Filtrar por rol"
            options={[
              { value: 'todos', label: 'Todos los roles' },
              { value: 'Super Admin', label: 'Super Admin' },
              { value: 'Director', label: 'Director' },
              { value: 'Docente', label: 'Docente' },
            ]}
          />
          <Button variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
            <X size={14} /> Limpiar filtros
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
            <span className="mr-1 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-500">
              Activos:
            </span>
            {query && (
              <FilterChip onRemove={() => setQuery('')}>"{query}"</FilterChip>
            )}
            {actionFilter !== 'todas' && (
              <FilterChip onRemove={() => setActionFilter('todas')}>
                {ACTIONS[actionFilter as LogAction].label}
              </FilterChip>
            )}
            {dateRange !== 'todo' && (
              <FilterChip onRemove={() => setDateRange('todo')}>
                {DATE_RANGE_LABELS[dateRange]}
              </FilterChip>
            )}
            {roleFilter !== 'todos' && (
              <FilterChip onRemove={() => setRoleFilter('todos')}>
                {roleFilter}
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
          rowKey={(log) => log.id}
          minWidth={960}
          rowClassName="h-[60px]"
          emptyMessage="Sin registros que coincidan con los filtros aplicados."
          expandedKey={expandedId}
          renderExpanded={(log) => {
            const formatted = formatDateTimeEs(log.date)
            return (
              <div className="grid grid-cols-1 gap-4 bg-ink-50/40 px-6 py-4 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    Detalle
                  </div>
                  <div className="mt-1 text-[13px] text-ink-800">{log.detail}</div>
                </div>
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    Timestamp (ISO)
                  </div>
                  <div className="mt-1 font-mono text-[12.5px] text-ink-700">
                    {formatted.iso}
                  </div>
                </div>
                <div className="flex items-end sm:justify-end">
                  <Button variant="outline" size="sm">
                    Ver entidad <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            )
          }}
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          summary={
            <>
              Mostrando{' '}
              <span className="num font-semibold text-ink-900">
                {filtered.length === 0 ? 0 : start + 1}
              </span>{' '}
              –{' '}
              <span className="num font-semibold text-ink-900">
                {Math.min(start + PAGE_SIZE, filtered.length)}
              </span>{' '}
              de{' '}
              <span className="num font-semibold text-ink-900">
                {filtered.length}
              </span>{' '}
              registros
            </>
          }
        />
      </Card>

      <AppFooter>Logs del Sistema · Super Admin · v2.1</AppFooter>
    </AppLayout>
  )
}
