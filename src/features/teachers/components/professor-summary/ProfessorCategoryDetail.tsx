import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft } from 'lucide-react'

import { Stagger } from '@/components/common/stagger'
import { DataTable, StatTile, type DataTableColumn } from '@/shared/ui'
import {
  professorScoreTone,
  type ProfessorCategory,
  type ProfessorComment,
  type ProfessorPeriod,
  type ProfessorQuestion,
} from '../../model/professorSummary'

export interface ProfessorCategoryDetailProps {
  category: ProfessorCategory
  categories: ProfessorCategory[]
  comments: ProfessorComment[]
  teacherId: number
  periodValue?: string
  periods?: ProfessorPeriod[]
  onBack: () => void
  onSelect: (categoryId: string) => void
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex w-full min-w-44 flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger className="bg-border block h-4 flex-1 cursor-default overflow-hidden rounded-full">
            <span
              className="bg-primary/80 block h-full rounded-full"
              style={{ width: `${(value / 5) * 100}%` }}
            />
          </TooltipTrigger>

          <TooltipContent>
            Puntaje: {value.toFixed(2)} / 5.00
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export function ProfessorCategoryDetail({
  category,
  categories,
  onBack,
  onSelect,
}: ProfessorCategoryDetailProps) {
  const questionColumns: DataTableColumn<ProfessorQuestion>[] = [
    {
      header: 'Codigo',
      cellClassName: 'align-top py-4',
      cell: (question) => (
        <span className="text-muted-foreground font-mono text-xs">{question.code}</span>
      ),
    },
    {
      header: 'Pregunta',
      cellClassName: 'align-top py-4',
      cell: (question) => (
        <p className="text-foreground/80 text-sm leading-normal" style={{ textWrap: 'pretty' }}>
          {question.text}
        </p>
      ),
    },
    {
      header: 'Puntaje',
      headerClassName: 'w-48',
      cellClassName: 'align-top py-4',
      cell: (question) => <ScoreBar value={question.mine} />,
    },
    {
      header: '',
      headerClassName: 'text-right',
      cellClassName: 'align-top py-4 text-right whitespace-nowrap',
      cell: (question) => (
        <div
          className={`num text-sm font-semibold tabular-nums ${professorScoreTone(question.mine)}`}
        >
          {question.mine.toFixed(2)}
        </div>
      ),
    },
  ]

  const otherCategories = categories.filter((item) => item.id !== category.id)

  return (
    <section className="space-y-6">
      <Stagger delay={0}>
        <div>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={16} />
            Volver al resumen
          </Button>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl leading-tight font-semibold tracking-tight">
                {category.name}
              </h1>
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
      </Stagger>

      <Stagger delay={0}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <StatTile
            label={`Promedio en ${category.name}`}
            value={category.score.toFixed(2)}
            valueClassName={professorScoreTone(category.score)}
            sub="/5.0 en esta categoria"
          />
        </div>
      </Stagger>

      <Stagger delay={0}>
        <Card className="gap-0 overflow-hidden pb-0">
          <CardHeader>
            <CardTitle>Desglose de preguntas</CardTitle>

            <p className="text-muted-foreground mt-1 text-sm">
              Su calificacion en cada pregunta de esta categoria.
            </p>
          </CardHeader>

          <CardContent className="p-0">
            <DataTable
              columns={questionColumns}
              rows={category.questions}
              rowKey={(question) => question.code}
              headerVariant="muted"
              minWidth={640}
            />
          </CardContent>
        </Card>
      </Stagger>
    </section>
  )
}
