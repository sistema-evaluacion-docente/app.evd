import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge, Card, DataTable, StatTile, type DataTableColumn } from '@/shared/ui'

import {
  findSubjectCategory,
  professorScoreTone,
  type ProfessorCategory,
  type ProfessorComment,
  type ProfessorPeriod,
  type ProfessorQuestion,
  type ProfessorSubject,
  type ProfessorSubjectQuestion,
} from '../model/data'
import { ProfessorCategoryComparison } from './ProfessorCategoryComparison'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'

/** Sentinel value for the "general average" (all subjects) select option. */
const GENERAL = 'promedio-general'

export interface ProfessorCategoryDetailProps {
  category: ProfessorCategory
  categories: ProfessorCategory[]
  /** Every period comment, so the reused table can filter across categories. */
  comments: ProfessorComment[]
  periodValue: string
  /** Logged-in teacher, used to fan-out the per-category history. */
  teacherId: number
  /** Every evaluated period, for the history comparison chart/table. */
  periods: ProfessorPeriod[]
  /** Subjects of the current period, offered in the "por materia" select. */
  subjects: ProfessorSubject[]
  /** Selected subject (`null` = general average across all subjects). */
  subjectKey: string | null
  onSubjectChange: (subjectKey: string | null) => void
  onBack: () => void
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
          <Tooltip>
            <TooltipTrigger className="block h-2.5 flex-1 cursor-default overflow-hidden rounded-full bg-ink-100">
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

/** Per-category breakdown: stats, question comparison and category comments.
 * A subject select scopes everything to a single subject; when scoped there is
 * no department benchmark, so the comparison pieces are hidden. */
export function ProfessorCategoryDetail({
  category,
  categories,
  comments,
  periodValue,
  teacherId,
  periods,
  subjects,
  subjectKey,
  onSubjectChange,
  onBack,
}: ProfessorCategoryDetailProps) {
  const [showComparison, setShowComparison] = useState(false)

  const selectedSubject = subjectKey
    ? subjects.find((item) => item.key === subjectKey)
    : undefined
  const scopedCategory = selectedSubject
    ? findSubjectCategory(selectedSubject, category.name)
    : undefined
  const isScoped = selectedSubject != null

  const subjectItems = [
    { value: GENERAL, label: 'Promedio general' },
    ...subjects.map((item) => ({
      value: item.key,
      label: item.group ? `${item.name} · ${item.group}` : item.name,
    })),
  ]

  const score = isScoped ? (scopedCategory?.score ?? 0) : category.score

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
            {question.dept.toFixed(2)}
          </div>
        </>
      ),
    },
  ]

  // Scoped mode has no department benchmark: drop the comparison column and the
  // department sub-score.
  const scopedQuestionColumns: DataTableColumn<ProfessorSubjectQuestion>[] = [
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
      header: 'Puntaje',
      headerClassName: 'text-right',
      cellClassName: 'align-top py-4 text-right whitespace-nowrap',
      cell: (question) => (
        <div
          className={`num text-[14px] font-semibold tabular-nums ${professorScoreTone(question.score)}`}
        >
          {question.score.toFixed(2)}
        </div>
      ),
    },
  ]

  return (
    <>
      <div>
        <Button
          variant="ghost"
          className="-ml-3 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Volver
        </Button>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                {category.name}
              </h1>
              <Badge
                variant="info"
                className="h-[26px] px-3 text-[12px] normal-case tracking-normal"
              >
                Semestre {periodValue}
              </Badge>
            </div>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              Desglose de preguntas y comentarios de esta categoría
              {isScoped ? ` en ${selectedSubject?.name}.` : '.'}
            </p>
          </div>

          {subjects.length > 0 && (
            <div className="w-full sm:w-64">
              <Label htmlFor="professor-subject">Materia</Label>
              <Select
                items={subjectItems}
                value={subjectKey ?? GENERAL}
                onValueChange={(value) => {
                  if (value) onSubjectChange(value === GENERAL ? null : value)
                }}
              >
                <SelectTrigger id="professor-subject" className="mt-1.5 h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="w-auto">
                  {subjectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 ${isScoped ? '' : 'sm:grid-cols-2'}`}
      >
        <StatTile
          label="Su promedio"
          value={score.toFixed(1)}
          valueClassName={professorScoreTone(score)}
          sub={
            isScoped
              ? `/5.0 en ${selectedSubject?.name}`
              : '/5.0 en esta categoría'
          }
        />
        {!isScoped && (
          <StatTile
            label="Demás docentes"
            value={category.deptScore.toFixed(1)}
            sub="promedio del departamento"
          />
        )}
      </div>

      {!isScoped && (
        <>
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
            <ProfessorCategoryComparison
              category={category}
              teacherId={teacherId}
              periods={periods}
            />
          )}
        </>
      )}

      <Card className="overflow-hidden">
        <div className="p-6 pb-4 sm:p-7 sm:pb-4">
          <h2 className="text-[18px] font-semibold text-ink-900">
            Desglose de preguntas
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {isScoped
              ? `Su calificación en cada pregunta en ${selectedSubject?.name}.`
              : 'Su calificación en cada pregunta, comparada con el promedio de los demás docentes.'}
          </p>
        </div>
        {isScoped ? (
          <DataTable
            columns={scopedQuestionColumns}
            rows={scopedCategory?.questions ?? []}
            rowKey={(question) => question.code}
            headerVariant="muted"
            minWidth={560}
            emptyMessage="Esta materia no tiene preguntas registradas en esta categoría."
          />
        ) : (
          <DataTable
            columns={questionColumns}
            rows={category.questions}
            rowKey={(question) => question.code}
            headerVariant="muted"
            minWidth={760}
          />
        )}
      </Card>

      <ProfessorCommentsTable
        key={`${category.id}::${subjectKey ?? GENERAL}`}
        comments={comments}
        categories={categories}
        defaultCategory={category.name}
        defaultSubject={selectedSubject?.name}
      />
    </>
  )
}
