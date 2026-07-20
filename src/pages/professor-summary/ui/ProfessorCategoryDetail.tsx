import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge, Card, DataTable, StatTile, type DataTableColumn } from '@/shared/ui'

import {
  professorRiskBadge,
  professorScoreTone,
  type ProfessorCategory,
  type ProfessorQuestion,
} from '../model/data'

export interface ProfessorCategoryDetailProps {
  category: ProfessorCategory
  categories: ProfessorCategory[]
  periodValue: string
  onBack: () => void
  onSelect: (categoryId: string) => void
}

function ComparisonBars({ question }: { question: ProfessorQuestion }) {
  const rows = [
    { label: 'Usted', value: question.mine, fill: 'bg-blue-300' },
    { label: 'Docentes', value: question.dept, fill: 'bg-ink-300' },
  ]
  return (
    <div className="flex w-full min-w-44 flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[11.5px] text-ink-500">{row.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <span
              className={`block h-full rounded-full ${row.fill}`}
              style={{ width: `${(row.value / 5) * 100}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

/** Per-category breakdown: stats, question comparison and category comments. */
export function ProfessorCategoryDetail({
  category,
  categories,
  periodValue,
  onBack,
  onSelect,
}: ProfessorCategoryDetailProps) {
  const questionColumns: DataTableColumn<ProfessorQuestion>[] = [
    {
      header: 'Código',
      cellClassName: 'align-top py-4',
      cell: (question) => (
        <span className="font-mono text-[12px] text-ink-500">{question.code}</span>
      ),
    },
    {
      header: 'Pregunta',
      cellClassName: 'align-top py-4',
      cell: (question) => (
        <p
          className="text-[13.5px] leading-normal text-ink-700"
          style={{ textWrap: 'pretty' }}
        >
          {question.text}
        </p>
      ),
    },
    {
      header: 'Comparación',
      headerClassName: 'w-70',
      cellClassName: 'align-top py-4',
      cell: (question) => <ComparisonBars question={question} />,
    },
    {
      header: 'Puntaje',
      headerClassName: 'text-right',
      cellClassName: 'align-top py-4 text-right whitespace-nowrap',
      cell: (question) => (
        <>
          <div
            className={`num text-[14px] font-semibold tabular-nums ${professorScoreTone(question.mine)}`}
          >
            {question.mine.toFixed(2)}
          </div>
          <div className="num mt-1 text-[12px] tabular-nums text-ink-400">
            vs {question.dept.toFixed(2)}
          </div>
        </>
      ),
    },
  ]

  const otherCategories = categories.filter((item) => item.id !== category.id)

  return (
    <>
      <div>
        <Button
          variant="ghost"
          className="-ml-3 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Volver al resumen
        </Button>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {category.name}
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              Desglose de preguntas y comentarios · Periodo {periodValue}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {otherCategories.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                className="rounded-full font-medium"
                onClick={() => onSelect(item.id)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Su promedio"
          value={category.score.toFixed(1)}
          valueClassName={professorScoreTone(category.score)}
          sub="/5.0 en esta categoría"
        />
        <StatTile
          label="Demás docentes"
          value={category.deptScore.toFixed(1)}
          sub="promedio del departamento"
        />
        <StatTile
          label="Preguntas"
          value={category.questions.length}
          sub="evaluadas en la categoría"
        />
        <StatTile
          label="Comentarios"
          value={category.comments.length}
          sub="asociados a esta categoría"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 pb-4 sm:p-7 sm:pb-4">
          <h2 className="text-[18px] font-semibold text-ink-900">
            Desglose de preguntas
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Su calificación en cada pregunta, comparada con el promedio de los demás
            docentes.
          </p>
        </div>
        <DataTable
          columns={questionColumns}
          rows={category.questions}
          rowKey={(question) => question.code}
          headerVariant="muted"
          minWidth={760}
        />
      </Card>

      <Card className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[18px] font-semibold text-ink-900">
            Comentarios de esta categoría
          </h2>
          <span className="num text-[13.5px] tabular-nums text-ink-500">
            {category.comments.length} comentarios
          </span>
        </div>
        <div className="mt-2 flex flex-col">
          {category.comments.map((comment) => {
            const badge = professorRiskBadge(comment.risk)
            return (
              <div
                key={comment.id}
                className="flex items-start gap-5 border-b border-ink-100 py-4 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13.5px] leading-relaxed text-ink-800"
                    style={{ textWrap: 'pretty' }}
                  >
                    <span className="text-ink-400">“</span>
                    {comment.text}
                    <span className="text-ink-400">”</span>
                  </p>
                  <div className="mt-1.5 text-[12px] text-ink-500">{comment.subject}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={badge.variant} className="min-w-16 justify-center">
                    {badge.label}
                  </Badge>
                  {comment.confidence != null && (
                    <span className="num text-[11.5px] tabular-nums text-ink-500">
                      {comment.confidence}% confianza
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {category.comments.length === 0 && (
            <p className="mt-4 text-[13.5px] text-ink-500">
              Esta categoría no tiene comentarios en el periodo seleccionado.
            </p>
          )}
        </div>
      </Card>
    </>
  )
}
