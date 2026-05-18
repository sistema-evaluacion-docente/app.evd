import { ArrowRight, ArrowUp, Download, Info, MessageSquare } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import {
  AppFooter,
  AreaChart,
  Badge,
  Button,
  Card,
  DataTable,
  FilterPills,
  PageHeader,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

const ME = {
  name: 'Dr. Roberto Jiménez',
  faculty: 'Facultad de Ingeniería',
  periodAverage: 4.2,
  globalAverage: 4.6,
  history: [
    { label: '2022-1', value: 3.7 },
    { label: '2022-2', value: 3.6 },
    { label: '2023-1', value: 3.9 },
    { label: '2023-2', value: 4.4 },
    { label: '2024-1', value: 4.3 },
    { label: 'ACTUAL', value: 4.6 },
  ],
  subjects: [
    { name: 'Arquitectura de Software', faculty: 'Facultad de Ingeniería', comments: 18 },
    { name: 'Ingeniería de Requisitos', faculty: 'Facultad de Ingeniería', comments: 12 },
    { name: 'Ética Profesional', faculty: 'Facultad de Ingeniería', comments: 8 },
  ],
  dimensions: [
    { id: 'desempeno', label: 'Desempeño Docente', value: 92 },
    { id: 'desarrollo', label: 'Desarrollo del Conocimiento', value: 85 },
    { id: 'procesos', label: 'Procesos de Evaluación', value: 95 },
    { id: 'integracion', label: 'Integración Interpersonal', value: 88 },
  ],
  comments: [
    { id: 1, text: 'Las explicaciones son muy claras y siempre está dispuesto a resolver dudas fuera de clase.', risk: 'bajo', tag: 'Desempeño Docente', subject: 'Arquitectura de Software' },
    { id: 2, text: 'Buen manejo del aula y dominio del tema; podría incluir más ejemplos prácticos del sector.', risk: 'medio', tag: 'Desarrollo del Conocimiento', subject: 'Ingeniería de Requisitos' },
    { id: 3, text: 'El semestre fue muy denso y faltó organización en las fechas de los entregables.', risk: 'alto', tag: 'Procesos de Evaluación', subject: 'Ética Profesional' },
    { id: 4, text: 'Excelente acompañamiento durante el desarrollo de los proyectos finales.', risk: 'bajo', tag: 'Integración Interpersonal', subject: 'Arquitectura de Software' },
  ],
}

type RiskLevel = 'alto' | 'medio' | 'bajo'

interface SummaryComment {
  id: number
  text: string
  risk: string
  tag: string
  subject: string
}

const RISK_BADGE: Record<RiskLevel, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  alto: { label: 'ALTO', variant: 'danger' },
  medio: { label: 'MEDIO', variant: 'warning' },
  bajo: { label: 'BAJO', variant: 'success' },
}

function KpiTile({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: ReactNode
  sub?: string
  trend?: string
}) {
  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        {label}
      </div>
      <div className="mt-3 leading-none">{value}</div>
      {sub && <div className="mt-2 text-[12.5px] text-ink-500">{sub}</div>}
      {trend && (
        <div className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-700">
          <ArrowUp size={12} /> {trend}
        </div>
      )}
    </Card>
  )
}

export function MySummaryPage() {
  const [riskFilter, setRiskFilter] = useState('todos')

  const totalComments = ME.subjects.reduce((sum, item) => sum + item.comments, 0)

  const filteredComments = useMemo(
    () =>
      riskFilter === 'todos'
        ? ME.comments
        : ME.comments.filter((comment) => comment.risk === riskFilter),
    [riskFilter],
  )

  const commentColumns: DataTableColumn<SummaryComment>[] = [
    {
      header: 'Comentario del estudiante',
      cellClassName: 'align-top py-4 max-w-[540px]',
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
      header: 'Asignatura',
      cellClassName: 'align-top py-4 whitespace-nowrap',
      cell: (comment) => (
        <span className="text-[13px] text-ink-700">{comment.subject}</span>
      ),
    },
    {
      header: 'Riesgo',
      cellClassName: 'align-top py-4',
      cell: (comment) => {
        const badge = RISK_BADGE[comment.risk as RiskLevel]
        return <Badge variant={badge.variant}>{badge.label}</Badge>
      },
    },
    {
      header: 'Etiqueta',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-ink-200 bg-ink-50/60 px-2.5 text-[11px] font-medium text-ink-700">
          {comment.tag}
        </span>
      ),
    },
  ]

  return (
    <AppLayout
      role="teacher"
      header={{ userName: ME.name, userRole: ME.faculty }}
    >
      <PageHeader
        title="Mi Resumen de Evaluación"
        description="Análisis detallado del desempeño académico en el periodo actual."
        actions={
          <Button variant="outline" size="lg">
            <Download size={15} />
            Descargar Reporte Individual
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          label="Periodo Académico"
          value={
            <span className="num text-[40px] font-semibold tabular-nums text-ink-900">
              2024-1
            </span>
          }
        />
        <KpiTile
          label="Promedio Global"
          value={
            <span className="num text-[40px] font-semibold tabular-nums text-brand-600">
              {ME.periodAverage.toFixed(1)}
            </span>
          }
          trend="+2.4% vs anterior"
        />
        <KpiTile
          label="Nivel de Desempeño"
          value={
            <span className="text-[32px] font-semibold leading-tight text-brand-600">
              Sobresaliente
            </span>
          }
          sub="Dentro del top 5% institucional"
        />
      </div>

      {/* Evolution chart */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-ink-900">
              Evolución del promedio global
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Tendencia histórica por periodo académico (2022-1 a 2024-1)
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="num text-[36px] font-semibold leading-none tabular-nums text-ink-900">
                {ME.globalAverage.toFixed(1)}
              </span>
              <span className="text-[14px] font-medium text-ink-500">/5.0</span>
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-700">
              <ArrowUp size={12} /> +2.1% este año
            </div>
          </div>
        </div>
        <div className="mt-6">
          <AreaChart
            data={ME.history}
            yMin={2.5}
            yMax={5}
            yTicks={[3, 3.5, 4, 4.5, 5]}
            width={1000}
            height={360}
            formatValue={(value) => `${value.toFixed(1)}/5`}
          />
        </div>
      </Card>

      {/* Subjects + dimensions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="h-full p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <MessageSquare size={16} />
            </span>
            <h2 className="text-[17px] font-semibold text-ink-900">
              Comentarios por Asignatura
            </h2>
          </div>
          <p className="mb-4 text-[12.5px] text-ink-500">
            Total:{' '}
            <span className="num font-semibold tabular-nums text-ink-700">
              {totalComments}
            </span>{' '}
            comentarios este periodo
          </p>
          <ul className="divide-y divide-ink-100">
            {ME.subjects.map((subject) => (
              <li
                key={subject.name}
                className="flex items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-ink-900">
                    {subject.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-500">
                    {subject.faculty}
                  </div>
                </div>
                <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-50 px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-brand-700">
                  <span className="num tabular-nums">{subject.comments}</span>{' '}
                  comentarios
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-ink-100 pt-4">
            <button
              type="button"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-600 transition-colors hover:bg-brand-50"
            >
              Ver todos los comentarios <ArrowRight size={14} />
            </button>
          </div>
        </Card>

        <Card className="h-full p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <h2 className="text-[17px] font-semibold text-ink-900">
              Promedio por Dimensión
            </h2>
            <Info size={15} className="text-ink-400" />
          </div>
          <ul className="space-y-5">
            {ME.dimensions.map((dimension) => (
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
      </div>

      {/* Comments */}
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-[20px] font-semibold text-ink-900">
              Comentarios Detallados
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Análisis automático de tus comentarios, clasificados por dimensión y
              nivel.
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
        Periodo Académico 2024-1 · {ME.name} · v2.1
      </AppFooter>
    </AppLayout>
  )
}
