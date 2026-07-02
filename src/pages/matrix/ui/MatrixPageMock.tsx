import { ArrowDown, ArrowUp, ChevronRight, Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'

import { EVALUATION_DIMENSIONS, ITEM_SCORES } from '@/entities/evaluation'
import { cn } from '@/shared/lib/utils'
import {
  AppFooter,
  Avatar,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

const TEACHERS_LIST = [
  { id: 'DOC-2014', name: 'Dr. Roberto Jiménez', faculty: 'Facultad de Ingeniería' },
  { id: 'DOC-2015', name: 'Dra. Patricia Salgado', faculty: 'Facultad de Ingeniería' },
  { id: 'DOC-2016', name: 'Ing. Jorge Iván Méndez', faculty: 'Facultad de Ingeniería' },
  { id: 'DOC-2017', name: 'Mg. Lucía Herrera', faculty: 'Facultad de Ingeniería' },
]

interface DimensionAverage {
  id: string
  label: string
  color: string
  itemCount: number
  individual: number
  department: number
}

function DimensionCard({ dimension }: { dimension: DimensionAverage }) {
  const delta = dimension.individual - dimension.department
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            {dimension.label}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-400">
            {dimension.itemCount} ítems
          </div>
        </div>
        <span
          className="mt-2 h-2 w-2 rounded-full"
          style={{ background: dimension.color }}
        />
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="num text-[32px] font-semibold leading-none tabular-nums text-ink-900">
          {dimension.individual.toFixed(1)}
        </span>
        <span className="text-[13px] font-medium text-ink-500">/5</span>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-0.5 text-[11.5px] font-semibold',
            delta >= 0 ? 'text-emerald-700' : 'text-brand-700',
          )}
        >
          {delta >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          {Math.abs(delta).toFixed(2)}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <ComparisonBar
          label="Individual"
          value={dimension.individual}
          color={dimension.color}
          emphasis
        />
        <ComparisonBar
          label="Departamento"
          value={dimension.department}
          color="#9AA0AB"
        />
      </div>
    </Card>
  )
}

function ComparisonBar({
  label,
  value,
  color,
  emphasis,
}: {
  label: string
  value: number
  color: string
  emphasis?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.06em]">
        <span className={emphasis ? 'text-ink-700' : 'text-ink-500'}>{label}</span>
        <span
          className={cn('num tabular-nums', emphasis ? 'text-ink-900' : 'text-ink-600')}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}

export function MatrixPageMock() {
  const [teacherId, setTeacherId] = useState(TEACHERS_LIST[0].id)
  const [search, setSearch] = useState('')
  const [activeDim, setActiveDim] = useState('todas')

  const teacher = TEACHERS_LIST.find((item) => item.id === teacherId)!

  const dimensionAverages = useMemo<DimensionAverage[]>(() => {
    return EVALUATION_DIMENSIONS.map((dimension) => {
      const scores = dimension.items.map((item) => ITEM_SCORES[item.code])
      return {
        id: dimension.id,
        label: dimension.label,
        color: dimension.color,
        itemCount: dimension.items.length,
        individual:
          scores.reduce((sum, score) => sum + score.individual, 0) / scores.length,
        department:
          scores.reduce((sum, score) => sum + score.department, 0) / scores.length,
      }
    })
  }, [])

  const globalIndividual =
    dimensionAverages.reduce((sum, item) => sum + item.individual, 0) /
    dimensionAverages.length
  const globalDepartment =
    dimensionAverages.reduce((sum, item) => sum + item.department, 0) /
    dimensionAverages.length

  const flatItems = useMemo(
    () =>
      EVALUATION_DIMENSIONS.flatMap((dimension) =>
        dimension.items.map((item) => ({
          ...item,
          dimLabel: dimension.label,
          individual: ITEM_SCORES[item.code].individual,
        })),
      ),
    [],
  )
  const sortedItems = [...flatItems].sort((a, b) => b.individual - a.individual)
  const strengths = sortedItems.slice(0, 3)
  const opportunities = sortedItems.slice(-3).reverse()

  const filteredDimensions = useMemo(() => {
    return EVALUATION_DIMENSIONS.filter(
      (dimension) => activeDim === 'todas' || activeDim === dimension.id,
    )
      .map((dimension) => ({
        ...dimension,
        items: dimension.items.filter((item) => {
          if (!search) return true
          const query = search.toLowerCase()
          return (
            item.label.toLowerCase().includes(query) || item.code.includes(query)
          )
        }),
      }))
      .filter((dimension) => dimension.items.length > 0)
  }, [search, activeDim])

  return (
    <AppLayout
      header={{
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link href="/teachers" className="transition-colors hover:text-ink-900">
              Docentes
            </Link>
            <ChevronRight size={12} className="text-ink-300" />
            <span className="font-medium text-ink-900">Matriz de Evaluación</span>
          </>
        ),
      }}
    >
      <PageHeader
        title="Matriz de Evaluación Docente"
        description="Evaluación por estudiantes según los 22 ítems institucionales UFPS, agrupados en 4 dimensiones. Compara el desempeño individual con el promedio del departamento."
        actions={
          <>
            <div>
              <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Docente
              </label>
              <Select
                value={teacherId}
                onChange={setTeacherId}
                options={TEACHERS_LIST.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                className="w-[260px]"
              />
            </div>
            <Button variant="outline" size="lg" className="self-end">
              <Download size={14} />
              Exportar matriz
            </Button>
          </>
        }
      />

      {/* Overall summary */}
      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_auto]">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={teacher.name} size={56} paletteIndex={0} />
            <div className="min-w-0">
              <div className="text-[18px] font-semibold text-ink-900">
                {teacher.name}
              </div>
              <div className="text-[13px] text-ink-500">
                {teacher.faculty} · Periodo 2024-1
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Promedio Individual
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="num text-[34px] font-semibold leading-none tabular-nums text-ink-900">
                  {globalIndividual.toFixed(2)}
                </span>
                <span className="text-[13px] font-medium text-ink-500">/5</span>
              </div>
            </div>
            <div className="hidden h-12 w-px bg-ink-200 sm:block" />
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Promedio Departamento
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="num text-[34px] font-semibold leading-none tabular-nums text-ink-500">
                  {globalDepartment.toFixed(2)}
                </span>
                <span className="text-[13px] font-medium text-ink-400">/5</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Diferencia
            </div>
            <div className="num mt-1 inline-flex items-center gap-1 text-[24px] font-semibold leading-none tabular-nums text-emerald-700">
              <ArrowUp size={18} />
              {Math.abs(globalIndividual - globalDepartment).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Dimension cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dimensionAverages.map((dimension) => (
          <DimensionCard key={dimension.id} dimension={dimension} />
        ))}
      </div>

      {/* Comparison chart */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-900">
              Comparación por dimensión
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Promedios consolidados — Individual vs. Departamento
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11.5px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-ink-900" /> Individual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-ink-300" /> Departamento
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {dimensionAverages.map((dimension) => (
            <div key={dimension.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: dimension.color }}
                  />
                  <span className="truncate text-[12.5px] font-medium text-ink-800">
                    {dimension.label}
                  </span>
                </div>
                <div className="num text-[11.5px] tabular-nums">
                  <span className="font-semibold text-ink-900">
                    {dimension.individual.toFixed(2)}
                  </span>
                  <span className="mx-1 text-ink-400">/</span>
                  <span className="text-ink-500">
                    {dimension.department.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="relative h-6 overflow-hidden rounded-md bg-ink-50">
                <div
                  className="absolute inset-y-0 left-0 bg-ink-200"
                  style={{ width: `${(dimension.department / 5) * 100}%` }}
                />
                <div
                  className="absolute inset-y-1 left-1 rounded-sm bg-ink-900"
                  style={{
                    width: `calc(${(dimension.individual / 5) * 100}% - 8px)`,
                  }}
                />
                {[1, 2, 3, 4].map((tick) => (
                  <span
                    key={tick}
                    className="absolute inset-y-0 w-px bg-white/70"
                    style={{ left: `${tick * 20}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InsightList
          title="Fortalezas"
          subtitle="Ítems con mejor desempeño del docente"
          dotClass="bg-emerald-500"
          rows={strengths}
        />
        <InsightList
          title="Oportunidades de mejora"
          subtitle="Ítems que requieren atención"
          dotClass="bg-brand-600"
          rows={opportunities}
        />
      </div>

      {/* Item filter */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ítem o código (001-022)..."
              icon={<Search size={14} />}
            />
          </div>
          <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
            <DimChip
              active={activeDim === 'todas'}
              onClick={() => setActiveDim('todas')}
            >
              Todas
            </DimChip>
            {EVALUATION_DIMENSIONS.map((dimension) => (
              <DimChip
                key={dimension.id}
                active={activeDim === dimension.id}
                onClick={() => setActiveDim(dimension.id)}
                dotColor={dimension.color}
              >
                {dimension.label.split(' ').slice(-2).join(' ')}
              </DimChip>
            ))}
          </div>
        </div>
      </Card>

      {/* Item matrix */}
      {filteredDimensions.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-ink-500">
          Sin resultados para los filtros aplicados.
        </Card>
      ) : (
        filteredDimensions.map((dimension, dimensionIndex) => {
          const average = dimensionAverages.find((item) => item.id === dimension.id)!
          return (
            <Card key={dimension.id} className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[14px] font-semibold text-white"
                  style={{ background: dimension.color }}
                >
                  {dimensionIndex + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-semibold text-ink-900">
                    {dimension.label}
                  </h2>
                  <p className="text-[12px] text-ink-500">
                    {dimension.items.length} ítems · ítems{' '}
                    {dimension.items[0].code}–
                    {dimension.items[dimension.items.length - 1].code}
                  </p>
                </div>
                <span className="inline-flex h-7 items-center rounded-full border border-ink-200 bg-ink-50 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-700">
                  {average.individual.toFixed(2)} / 5
                </span>
              </div>
              <div className="px-5 py-2 sm:px-6">
                {dimension.items.map((item) => {
                  const score = ITEM_SCORES[item.code]
                  const delta = score.individual - score.department
                  return (
                    <div
                      key={item.code}
                      className="grid grid-cols-[88px_1fr_120px] items-center gap-4 border-b border-ink-100 py-3 last:border-b-0"
                    >
                      <span className="num inline-flex w-fit rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-ink-700">
                        {item.code}
                      </span>
                      <div className="min-w-0">
                        <div
                          className="mb-2 pr-2 text-[13.5px] leading-snug text-ink-800"
                          style={{ textWrap: 'pretty' }}
                        >
                          {item.label}
                        </div>
                        <div className="space-y-1">
                          <ItemBar
                            label="Individual"
                            value={score.individual}
                            color={dimension.color}
                            emphasis
                          />
                          <ItemBar
                            label="Departamento"
                            value={score.department}
                            color="#9AA0AB"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            'num text-[14px] font-semibold tabular-nums',
                            delta >= 0 ? 'text-emerald-700' : 'text-brand-700',
                          )}
                        >
                          {delta >= 0 ? '+' : ''}
                          {delta.toFixed(2)}
                        </div>
                        <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-500">
                          vs. depto.
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })
      )}

      <AppFooter>Matriz de Evaluación · UFPS · Periodo 2024-1 · v2.1</AppFooter>
    </AppLayout>
  )
}

function ItemBar({
  label,
  value,
  color,
  emphasis,
}: {
  label: string
  value: number
  color: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'w-[80px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.04em]',
          emphasis ? 'text-ink-600' : 'text-ink-500',
        )}
      >
        {label}
      </span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${(value / 5) * 100}%`, background: color }}
        />
      </div>
      <span
        className={cn(
          'num w-9 text-right text-[12px] font-semibold tabular-nums',
          emphasis ? 'text-ink-900' : 'text-ink-600',
        )}
      >
        {value.toFixed(1)}
      </span>
    </div>
  )
}

function DimChip({
  active,
  onClick,
  dotColor,
  children,
}: {
  active: boolean
  onClick: () => void
  dotColor?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors',
        active
          ? 'bg-ink-900 text-white'
          : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
      )}
    >
      {dotColor && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor }}
        />
      )}
      {children}
    </button>
  )
}

function InsightList({
  title,
  subtitle,
  dotClass,
  rows,
}: {
  title: string
  subtitle: string
  dotClass: string
  rows: { code: string; label: string; dimLabel: string; individual: number }[]
}) {
  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', dotClass)} />
        <h3 className="text-[14px] font-semibold text-ink-900">{title}</h3>
      </div>
      <p className="mb-3 text-[12px] text-ink-500">{subtitle}</p>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.code} className="flex items-start gap-3">
            <span className="num mt-0.5 shrink-0 rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-700">
              {row.code}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-snug text-ink-800">
                {row.label}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.04em] text-ink-500">
                {row.dimLabel}
              </div>
            </div>
            <span className="num mt-0.5 shrink-0 text-[14px] font-semibold tabular-nums text-ink-900">
              {row.individual.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
