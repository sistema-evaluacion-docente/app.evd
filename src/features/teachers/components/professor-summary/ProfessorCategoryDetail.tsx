import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge, DataTable, StatTile, type DataTableColumn } from '@/shared/ui'
import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import {
  professorScoreTone,
  type ProfessorCategory,
  type ProfessorComment,
  type ProfessorPeriod,
  type ProfessorQuestion,
} from '../../model/professorSummary'
import { ProfessorCategoryComparison } from './ProfessorCategoryComparison'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'

export interface ProfessorCategoryDetailProps {
  category: ProfessorCategory
  categories: ProfessorCategory[]
  comments: ProfessorComment[]
  periodValue: string
  teacherId: number
  periods: ProfessorPeriod[]
  onBack: () => void
  onSelect: (categoryId: string) => void
}

function ComparisonBars({ question }: { question: ProfessorQuestion }) {
  const rows = [
    { label: 'Usted', value: question.mine, fill: 'bg-primary/80' },
    { label: 'Docentes', value: question.dept, fill: 'bg-muted-foreground/30' },
  ]
  return (
    <div className="flex w-full min-w-44 flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-muted-foreground w-16 shrink-0 text-xs">{row.label}</span>

          <Tooltip>
            <TooltipTrigger className="bg-muted block h-2.5 flex-1 cursor-default overflow-hidden rounded-full">
              <span
                className={`block h-full rounded-full ${row.fill}`}
                style={{ width: `${(row.value / 5) * 100}%` }}
              />
            </TooltipTrigger>

            <TooltipContent>
              {row.label}: {row.value.toFixed(2)} / 5.00
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}

export function ProfessorCategoryDetail({
  category,
  categories,
  comments,
  periodValue,
  teacherId,
  periods,
  onBack,
  onSelect,
}: ProfessorCategoryDetailProps) {
  const [showComparison, setShowComparison] = useState(false)
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
      header: 'Comparacion',
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
            className={`num text-sm font-semibold tabular-nums ${professorScoreTone(question.mine)}`}
          >
            {question.mine.toFixed(2)}
          </div>
          <div className="num text-muted-foreground mt-1 text-xs tabular-nums">
            {question.dept.toFixed(2)}
          </div>
        </>
      ),
    },
  ]

  const otherCategories = categories.filter((item) => item.id !== category.id)

  return (
    <>
      <div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} />
          Volver al resumen
        </Button>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl leading-tight font-semibold tracking-tight">
                {category.name}
              </h1>

              <Badge variant="outline" className="h-7 px-3 text-xs tracking-normal normal-case">
                Semestre {periodValue}
              </Badge>
            </div>

            {/* <p className="text-muted-foreground mt-1.5 text-sm">
              Desglose de preguntas y comentarios de esta categoria.
            </p> */}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label={`Promedio en ${category.name}`}
          value={category.score.toFixed(1)}
          valueClassName={professorScoreTone(category.score)}
          sub="/5.0 en esta categoria"
        />

        <StatTile
          label="Promedio del departamento"
          value={category.deptScore.toFixed(1)}
          sub="promedio del departamento"
        />
      </div>

      <div>
        <Button
          variant="outline"
          className="w-full justify-center sm:w-auto"
          aria-expanded={showComparison}
          onClick={() => setShowComparison((open) => !open)}
        >
          <TrendingUp size={16} />
          Comparar con semestres anteriores
          {showComparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>

      {showComparison && (
        <ProfessorCategoryComparison category={category} teacherId={teacherId} periods={periods} />
      )}

      <Card className="gap-0 overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>Desglose de preguntas</CardTitle>

          <p className="text-muted-foreground mt-1 text-sm">
            Su calificacion en cada pregunta, comparada con el promedio de los demas docentes.
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={questionColumns}
            rows={category.questions}
            rowKey={(question) => question.code}
            headerVariant="muted"
            minWidth={760}
          />
        </CardContent>
      </Card>

      <ProfessorCommentsTable
        key={category.id}
        comments={comments}
        categories={categories}
        defaultCategory={category.name}
      />
    </>
  )
}
