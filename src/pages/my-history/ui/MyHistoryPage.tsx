import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, ChevronRight, Download, Info, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'

import { cn } from '@/shared/lib/utils'
import {
  AppFooter,
  AreaChart,
  Button,
  Card,
  DataTable,
  FilterPills,
  MultiLineChart,
  PageHeader,
  StatTile,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

interface PeriodRecord {
  id: string
  period: string
  score: number
  comments: number
  dims: {
    desempeno: number
    desarrollo: number
    procesos: number
    integracion: number
  }
}

const PERIODS: PeriodRecord[] = [
  { id: '2024-1', period: '2024-1', score: 4.8, comments: 38, dims: { desempeno: 92, desarrollo: 88, procesos: 95, integracion: 91 } },
  { id: '2023-2', period: '2023-2', score: 4.7, comments: 42, dims: { desempeno: 90, desarrollo: 86, procesos: 92, integracion: 90 } },
  { id: '2023-1', period: '2023-1', score: 4.5, comments: 36, dims: { desempeno: 85, desarrollo: 82, procesos: 88, integracion: 86 } },
  { id: '2022-2', period: '2022-2', score: 4.6, comments: 33, dims: { desempeno: 88, desarrollo: 84, procesos: 90, integracion: 87 } },
  { id: '2022-1', period: '2022-1', score: 4.4, comments: 29, dims: { desempeno: 82, desarrollo: 80, procesos: 86, integracion: 83 } },
  { id: '2021-2', period: '2021-2', score: 4.2, comments: 25, dims: { desempeno: 80, desarrollo: 78, procesos: 84, integracion: 81 } },
]

type Level = 'sobresaliente' | 'satisfactorio' | 'aceptable' | 'insuficiente'

const LEVEL: Record<
  Level,
  { label: string; bg: string; text: string; border: string; bar: string }
> = {
  sobresaliente: { label: 'SOBRESALIENTE', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70', bar: 'bg-emerald-500' },
  satisfactorio: { label: 'SATISFACTORIO', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/70', bar: 'bg-sky-500' },
  aceptable: { label: 'ACEPTABLE', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70', bar: 'bg-amber-500' },
  insuficiente: { label: 'INSUFICIENTE', bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-100', bar: 'bg-brand-600' },
}

const levelOf = (score: number): Level => {
  if (score >= 4.6) return 'sobresaliente'
  if (score >= 4.0) return 'satisfactorio'
  if (score >= 3.0) return 'aceptable'
  return 'insuficiente'
}

const CHRONO = [...PERIODS].reverse()

const GLOBAL_CHART = [
  ...CHRONO.map((period) => ({ label: period.period, value: period.score })),
  { label: 'ACTUAL', value: 4.6 },
]

type SortKey = 'period' | 'score'

export function MyHistoryPage() {
  const [mode, setMode] = useState<'global' | 'dims'>('global')
  const [levelFilter, setLevelFilter] = useState('todos')
  const [sortKey, setSortKey] = useState<SortKey>('period')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const scores = PERIODS.map((period) => period.score)
  const best = Math.max(...scores)
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length
  const cumulativeDelta = scores[0] - scores[scores.length - 1]
  const bestPeriod = PERIODS.find((period) => period.score === best)!

  const filtered = useMemo(() => {
    let rows = [...PERIODS]
    if (levelFilter !== 'todos') {
      rows = rows.filter((period) => levelOf(period.score) === levelFilter)
    }
    rows.sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'score') return (a.score - b.score) * direction
      return a.period.localeCompare(b.period) * direction
    })
    return rows
  }, [levelFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const deltaVsPrevious = (period: PeriodRecord): number | null => {
    const index = CHRONO.findIndex((item) => item.id === period.id)
    if (index <= 0) return null
    return period.score - CHRONO[index - 1].score
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const dimSeries = [
    { key: 'desempeno', label: 'Desempeño Docente', color: '#0F172A', values: CHRONO.map((p) => p.dims.desempeno) },
    { key: 'desarrollo', label: 'Desarrollo del Conocimiento', color: '#2A6FDB', values: CHRONO.map((p) => p.dims.desarrollo) },
    { key: 'procesos', label: 'Procesos de Evaluación', color: '#1F8A5B', values: CHRONO.map((p) => p.dims.procesos) },
    { key: 'integracion', label: 'Integración Interpersonal', color: '#D97757', values: CHRONO.map((p) => p.dims.integracion) },
  ]

  const sortHeader = (label: string, key: SortKey) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1.5 uppercase tracking-[0.08em]"
    >
      {label}
      <ArrowUpDown
        size={11}
        className={cn('opacity-60', sortKey === key && 'opacity-100')}
      />
    </button>
  )

  const columns: DataTableColumn<PeriodRecord>[] = [
    {
      header: '',
      headerClassName: 'w-10',
      cellClassName: 'pl-4',
      cell: (period) => (
        <input
          type="checkbox"
          checked={compareIds.includes(period.id)}
          onChange={() => toggleCompare(period.id)}
          className="h-4 w-4 rounded border-ink-300 accent-brand-600"
          aria-label={`Comparar ${period.period}`}
        />
      ),
    },
    {
      header: sortHeader('Periodo Académico', 'period'),
      cell: (period) => (
        <button
          type="button"
          onClick={() =>
            setExpandedId(expandedId === period.id ? null : period.id)
          }
          className="flex items-center gap-2 text-left"
        >
          <ChevronRight
            size={13}
            className={cn(
              'text-ink-400 transition-transform',
              expandedId === period.id && 'rotate-90',
            )}
          />
          <span className="text-[15px] font-semibold text-ink-900">
            {period.period}
          </span>
        </button>
      ),
    },
    {
      header: sortHeader('Promedio Global', 'score'),
      cell: (period) => {
        const level = LEVEL[levelOf(period.score)]
        return (
          <div className="flex items-center gap-3">
            <span className="num w-10 text-[15px] font-semibold tabular-nums text-ink-900">
              {period.score.toFixed(1)}
            </span>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-ink-100"
              style={{ width: 80 }}
            >
              <div
                className={cn('h-full', level.bar)}
                style={{ width: `${(period.score / 5) * 100}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      header: 'Nivel de Desempeño',
      cell: (period) => {
        const level = LEVEL[levelOf(period.score)]
        return (
          <span
            className={cn(
              'inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-[11px] font-semibold',
              level.bg,
              level.text,
              level.border,
            )}
          >
            {level.label}
          </span>
        )
      },
    },
    {
      header: 'Cambio',
      cell: (period) => {
        const delta = deltaVsPrevious(period)
        if (delta === null) {
          return <span className="text-[12.5px] text-ink-400">—</span>
        }
        return delta >= 0 ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-700">
            <ArrowUp size={11} /> +{delta.toFixed(1)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700">
            <ArrowDown size={11} /> {delta.toFixed(1)}
          </span>
        )
      },
    },
    {
      header: 'Comentarios',
      cell: (period) => (
        <span className="num text-[13.5px] tabular-nums text-ink-700">
          {period.comments}
        </span>
      ),
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: () => (
        <Link
          href="/me/summary"
          className="inline-flex h-8 items-center justify-center rounded-md bg-brand-600 px-3 text-[12.5px] font-semibold text-white hover:bg-brand-700"
        >
          Ver Detalle
        </Link>
      ),
    },
  ]

  return (
    <AppLayout
      header={{ userName: 'Dr. Roberto Jiménez', userRole: 'Facultad de Ingeniería' }}
    >
      <PageHeader
        underline
        title="Histórico de Evaluaciones"
        description={`Línea de tiempo completa de su desempeño docente en los últimos ${PERIODS.length} periodos académicos.`}
        actions={
          <Button variant="outline" size="lg">
            <Download size={15} />
            Exportar PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Mejor periodo"
          value={best.toFixed(1)}
          valueClassName="text-ink-900 text-[32px]"
          sub={`Alcanzado en ${bestPeriod.period}`}
        />
        <StatTile
          label="Promedio histórico"
          value={average.toFixed(2)}
          valueClassName="text-ink-900 text-[32px]"
          sub={`Basado en ${PERIODS.length} periodos`}
        />
        <StatTile
          label="Δ Acumulada"
          value={`+${cumulativeDelta.toFixed(1)}`}
          valueClassName="text-emerald-700 text-[32px]"
          sub="Desde 2021-2"
        />
      </div>

      {/* Chart */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-[18px] font-semibold text-ink-900">
              Evolución del promedio global
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Tendencia histórica por periodo académico (2021-2 a 2024-1)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md bg-ink-100 p-0.5">
              {(['global', 'dims'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={cn(
                    'h-7 rounded px-3 text-[12px] font-medium transition-colors',
                    mode === option
                      ? 'bg-white text-ink-900 shadow-card'
                      : 'text-ink-600 hover:text-ink-900',
                  )}
                >
                  {option === 'global' ? 'Promedio' : 'Dimensiones'}
                </button>
              ))}
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="num text-[32px] font-semibold leading-none tabular-nums text-ink-900">
                  4.6
                </span>
                <span className="text-[14px] font-medium text-ink-500">/5.0</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                <ArrowUp size={11} /> +2.1% este año
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {mode === 'global' ? (
            <AreaChart
              data={GLOBAL_CHART}
              yMin={2.5}
              yMax={5}
              yTicks={[3, 3.5, 4, 4.5, 5]}
              width={1000}
              height={360}
              formatValue={(value) => `${value.toFixed(1)}/5`}
            />
          ) : (
            <MultiLineChart
              labels={CHRONO.map((period) => period.period)}
              series={dimSeries}
              yMin={60}
              yMax={100}
              yTicks={[70, 80, 90, 100]}
              tickSuffix="%"
            />
          )}
        </div>
      </Card>

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <Card className="border-brand-200 bg-brand-50/50 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-700">
                Comparando
              </span>
              {compareIds.map((id) => {
                const period = PERIODS.find((item) => item.id === id)!
                return (
                  <span
                    key={id}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-brand-200/70 bg-white pl-2.5 pr-1.5 text-[12.5px]"
                  >
                    <span className="font-semibold text-ink-900">
                      {period.period}
                    </span>
                    <span className="num text-ink-500">
                      · {period.score.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCompare(id)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
                      aria-label="Quitar"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )
              })}
              {compareIds.length < 2 && (
                <span className="text-[12px] text-ink-500">
                  Seleccione otro periodo para comparar (máx. 2).
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCompareIds([])}>
                Limpiar
              </Button>
              {compareIds.length === 2 && (
                <Button variant="brand" size="sm">
                  Ver comparación <ArrowRight size={13} />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Level filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-500">
          Filtrar por nivel
        </span>
        <FilterPills
          value={levelFilter}
          onChange={setLevelFilter}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'sobresaliente', label: 'Sobresaliente' },
            { value: 'satisfactorio', label: 'Satisfactorio' },
            { value: 'aceptable', label: 'Aceptable' },
          ]}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(period) => period.id}
          headerVariant="dark"
          minWidth={820}
          rowClassName={(period) =>
            cn('h-[64px]', expandedId === period.id && 'bg-ink-50/40')
          }
          emptyMessage="Sin resultados para este filtro."
          expandedKey={expandedId}
          renderExpanded={(period) => <PeriodDetail period={period} />}
        />
        <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3.5 text-[12px] text-ink-500">
          <span>
            {filtered.length} {filtered.length === 1 ? 'periodo' : 'periodos'}{' '}
            mostrados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Info size={13} />
            Toque una fila para ver el desglose por dimensión
          </span>
        </div>
      </Card>

      <AppFooter>
        Dr. Roberto Jiménez · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  )
}

function PeriodDetail({ period }: { period: PeriodRecord }) {
  const dims = [
    { label: 'Desempeño Docente', value: period.dims.desempeno },
    { label: 'Desarrollo del Conocimiento', value: period.dims.desarrollo },
    { label: 'Procesos de Evaluación', value: period.dims.procesos },
    { label: 'Integración Interpersonal', value: period.dims.integracion },
  ]
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 bg-ink-50/40 px-6 pb-5 pt-4 md:grid-cols-2">
      <div className="col-span-1 space-y-3 md:col-span-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          Desglose por dimensión
        </div>
        {dims.map((dimension) => (
          <div key={dimension.label}>
            <div className="flex items-center justify-between text-[12px] font-medium">
              <span className="text-ink-700">{dimension.label}</span>
              <span className="num font-semibold tabular-nums text-ink-900">
                {dimension.value}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full bg-ink-800"
                style={{ width: `${dimension.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          Resumen del periodo
        </div>
        <ul className="space-y-1.5 text-[13px] text-ink-700">
          <li className="flex justify-between">
            <span>Comentarios recibidos</span>
            <span className="num font-semibold tabular-nums text-ink-900">
              {period.comments}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Promedio global</span>
            <span className="num font-semibold tabular-nums text-ink-900">
              {period.score.toFixed(1)} / 5.0
            </span>
          </li>
          <li className="flex justify-between">
            <span>Mejor dimensión</span>
            <span className="font-medium text-ink-900">
              Procesos de Evaluación
            </span>
          </li>
          <li className="flex justify-between">
            <span>Plan de mejoramiento</span>
            <span className="font-semibold text-emerald-700">Cerrado</span>
          </li>
        </ul>
        <Link
          href="/me/summary"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
        >
          Abrir expediente completo <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
