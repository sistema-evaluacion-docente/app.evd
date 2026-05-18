import {
  ArrowRight,
  ArrowUp,
  ClipboardList,
  Download,
  Eye,
  OctagonAlert,
  Plus,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
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
  PageHeader,
  Separator,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

interface KpiCardProps {
  label: string
  value: string
  icon: ReactNode
  accentBg: string
  accentText: string
  barColor: string
  progress: number
  trend: string
  trendVariant: 'up' | 'down' | 'flat'
}

function KpiCard({
  label,
  value,
  icon,
  accentBg,
  accentText,
  barColor,
  progress,
  trend,
  trendVariant,
}: KpiCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md',
            accentBg,
            accentText,
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11.5px] font-semibold tabular-nums',
            trendVariant === 'up' && 'bg-emerald-50 text-emerald-700',
            trendVariant === 'down' && 'bg-brand-50 text-brand-700',
            trendVariant === 'flat' && 'bg-ink-100 text-ink-600',
          )}
        >
          {trendVariant === 'up' && <ArrowUp size={11} />}
          {trend}
        </span>
      </div>
      <div className="mt-4 text-[13px] leading-snug text-ink-500">{label}</div>
      <div className="num mt-1.5 text-[40px] font-semibold leading-none tracking-tight tabular-nums text-ink-900">
        {value}
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className={cn('h-full transition-all duration-500', barColor)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  )
}

function PerfRow({
  dot,
  label,
  value,
  total,
}: {
  dot: string
  label: string
  value: number
  total: number
}) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2">
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      <div>
        <div className="text-[13px] font-medium text-ink-800">{label}</div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-100">
          <div className={cn('h-full', dot)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="num min-w-[2ch] text-right text-[14px] font-semibold tabular-nums text-ink-900">
        {value}
      </span>
    </div>
  )
}

interface RecentEvaluation {
  id: number
  name: string
  faculty: string
  type: string
  score: string
  scoreColor: 'green' | 'amber' | 'red'
  status: string
  statusVariant: 'success' | 'warning' | 'danger'
}

const RECENT: RecentEvaluation[] = [
  { id: 1, name: 'Ana María Torres', faculty: 'Ingeniería de Sistemas', type: 'Integral Semestral', score: '4.7/5', scoreColor: 'green', status: 'Cerrada', statusVariant: 'success' },
  { id: 2, name: 'Luis Carlos Herrera', faculty: 'Ingeniería Civil', type: 'Seguimiento Plan Mejora', score: '3.7/5', scoreColor: 'amber', status: 'En Revisión', statusVariant: 'warning' },
  { id: 3, name: 'Patricia Salgado', faculty: 'Ingeniería Electrónica', type: 'Integral Semestral', score: '4.2/5', scoreColor: 'green', status: 'Cerrada', statusVariant: 'success' },
  { id: 4, name: 'Jorge Iván Méndez', faculty: 'Ingeniería Industrial', type: 'Pares Académicos', score: '2.9/5', scoreColor: 'red', status: 'Crítica', statusVariant: 'danger' },
]

const PERFORMANCE = [
  { dot: 'bg-emerald-500', label: 'Sobresaliente (85+)', value: 64 },
  { dot: 'bg-sky-500', label: 'Satisfactorio (70-84)', value: 48 },
  { dot: 'bg-amber-500', label: 'Aceptable (60-69)', value: 11 },
  { dot: 'bg-brand-600', label: 'Insuficiente (<60)', value: 5 },
]

const CHART_DATA = [
  { label: '2022-1', value: 71.4 },
  { label: '2022-2', value: 73.8 },
  { label: '2023-1', value: 76.1 },
  { label: '2023-2', value: 78.6 },
  { label: '2024-1', value: 82.3 },
]

const SCORE_COLOR = {
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-brand-600',
}

export function DashboardPage() {
  const performanceTotal = PERFORMANCE.reduce((sum, item) => sum + item.value, 0)

  const columns: DataTableColumn<RecentEvaluation>[] = [
    {
      header: 'Docente',
      cell: (row) => (
        <div className="flex items-center gap-3 py-3">
          <Avatar name={row.name} size={36} paletteIndex={row.id + 2} />
          <div className="leading-tight">
            <div className="text-[13.5px] font-medium text-ink-900">
              {row.name}
            </div>
            <div className="text-[12px] text-ink-500">{row.faculty}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Tipo de Evaluación',
      cell: (row) => <span className="text-[13px] text-ink-700">{row.type}</span>,
    },
    {
      header: 'Puntaje',
      cell: (row) => (
        <span
          className={cn(
            'num text-[14px] font-semibold tabular-nums',
            SCORE_COLOR[row.scoreColor],
          )}
        >
          {row.score}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (row) => <Badge variant={row.statusVariant}>{row.status}</Badge>,
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (row) => (
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          aria-label={`Ver evaluación de ${row.name}`}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <AppLayout role="director" header={{ userName: 'Director Depto.', userRole: 'Ciencias Básicas' }}>
      <PageHeader
        title="Panel de Control"
        description="Bienvenido, Director de Departamento. Resumen operativo del periodo 2024-1."
        actions={
          <>
            <Button variant="outline" size="lg">
              <Download size={15} />
              Descargar Informe
            </Button>
            <Link
              href="/upload-evaluations"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus size={15} strokeWidth={2.25} />
              Nueva Evaluación
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Evaluaciones en curso"
          value="45"
          icon={<ClipboardList size={18} />}
          accentBg="bg-sky-50"
          accentText="text-sky-600"
          barColor="bg-sky-500"
          progress={62}
          trend="+5.2%"
          trendVariant="up"
        />
        <KpiCard
          label="Casos críticos"
          value="5"
          icon={<OctagonAlert size={18} />}
          accentBg="bg-brand-50"
          accentText="text-brand-600"
          barColor="bg-brand-600"
          progress={38}
          trend="+1"
          trendVariant="down"
        />
        <KpiCard
          label="Docentes registrados"
          value="128"
          icon={<Users size={18} />}
          accentBg="bg-emerald-50"
          accentText="text-emerald-600"
          barColor="bg-emerald-500"
          progress={100}
          trend="100%"
          trendVariant="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-ink-900">
                Evolución Histórica
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-500">
                Promedio global del departamento por periodo académico
              </p>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-600" /> Promedio
              </span>
              <span className="num inline-flex items-center gap-1 font-semibold text-emerald-700">
                <ArrowUp size={11} /> +10.9 pts
              </span>
            </div>
          </div>
          <div className="mt-4">
            <AreaChart
              data={CHART_DATA}
              yMin={0}
              yMax={100}
              yTicks={[60, 70, 80, 90, 100]}
              formatValue={(value) => `Promedio: ${value.toFixed(1)}`}
            />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-[18px] font-semibold text-ink-900">
            Estado del Departamento
          </h2>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em]">
              <span className="text-ink-500">Avance total evaluación</span>
              <span className="num text-brand-600">78%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full bg-brand-600 transition-all duration-700"
                style={{ width: '78%' }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Finalizadas
              </div>
              <div className="num mt-2 text-[28px] font-semibold leading-none tabular-nums text-ink-900">
                102
              </div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Pendientes
              </div>
              <div className="num mt-2 text-[28px] font-semibold leading-none tabular-nums text-ink-900">
                26
              </div>
            </div>
          </div>

          <Separator className="my-5" />

          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Desempeño promedio
            </div>
            <div className="-mx-1">
              {PERFORMANCE.map((item) => (
                <PerfRow
                  key={item.label}
                  dot={item.dot}
                  label={item.label}
                  value={item.value}
                  total={performanceTotal}
                />
              ))}
            </div>
          </div>

          <Link
            href="/teachers"
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-ink-200 bg-white text-[13.5px] font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-ink-50"
          >
            Ver Detalles de Desempeño <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 sm:px-6">
          <h3 className="text-[16px] font-semibold text-ink-900">
            Últimas Evaluaciones Procesadas
          </h3>
          <Link
            href="/teachers"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>
        <DataTable
          columns={columns}
          rows={RECENT}
          rowKey={(row) => row.id}
          headerVariant="default"
          minWidth={720}
        />
      </Card>

      <AppFooter>
        Periodo Académico 2024-1 · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  )
}
