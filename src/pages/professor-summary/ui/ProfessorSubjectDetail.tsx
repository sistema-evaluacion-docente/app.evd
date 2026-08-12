import { ArrowLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge, Card, StatTile } from '@/shared/ui'

import {
  professorScoreTone,
  type ProfessorCategory,
  type ProfessorComment,
  type ProfessorSubject,
} from '../model/data'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'

export interface ProfessorSubjectDetailProps {
  subject: ProfessorSubject
  /** Summary categories, used to resolve the target of a category drill-down
   * and to feed the comments filter. */
  categories: ProfessorCategory[]
  /** Every period comment; the table filters down to this subject. */
  comments: ProfessorComment[]
  periodValue: string
  onBack: () => void
  /** Opens the category detail scoped to this subject. */
  onSelectCategory: (categoryId: string) => void
}

const norm = (value: string) => value.trim().toLowerCase()

/** Subject-centered view: the subject's per-category grades and its comments. */
export function ProfessorSubjectDetail({
  subject,
  categories,
  comments,
  periodValue,
  onBack,
  onSelectCategory,
}: ProfessorSubjectDetailProps) {
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                {subject.name}
              </h1>
              <Badge
                variant="info"
                className="h-[26px] px-3 text-[12px] normal-case tracking-normal"
              >
                Semestre {periodValue}
              </Badge>
            </div>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {subject.group} · {subject.respondents} encuestado
              {subject.respondents !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Promedio de la materia"
          value={subject.score.toFixed(1)}
          valueClassName={professorScoreTone(subject.score)}
          sub="/5.0 general de la asignatura"
        />
        <StatTile
          label="Encuestados"
          value={String(subject.respondents)}
          sub="respuestas de estudiantes"
        />
      </div>

      <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
        <h2 className="text-[18px] font-semibold text-ink-900">
          Calificación por categoría
        </h2>
        <p className="mt-1 text-[13.5px] text-ink-500">
          Su nota por categoría en esta asignatura. Seleccione una para ver el desglose de
          preguntas.
        </p>

        <div className="mt-4 flex flex-col">
          {subject.categories.map((category) => {
            const summaryCategory = categories.find(
              (item) => norm(item.name) === norm(category.name),
            )
            const clickable = summaryCategory != null
            return (
              <button
                key={category.id}
                type="button"
                disabled={!clickable}
                onClick={() =>
                  summaryCategory && onSelectCategory(summaryCategory.id)
                }
                aria-label={
                  clickable ? `Ver preguntas de ${category.name}` : undefined
                }
                className={`-mx-2.5 grid grid-cols-[minmax(150px,250px)_1fr_56px_20px] min-h-13 items-center gap-4 rounded-md px-2.5 py-2 text-left transition-colors ${
                  clickable ? 'cursor-pointer hover:bg-ink-50/60' : 'cursor-default'
                }`}
              >
                <span className="text-[14px] font-medium text-ink-700">
                  {category.name}
                </span>
                <span className="relative block h-6 rounded-md bg-ink-100">
                  <span
                    className="absolute inset-y-0 left-0 rounded-md bg-blue-300"
                    style={{ width: `${(category.score / 5) * 100}%` }}
                  />
                </span>
                <span
                  className={`num text-right text-[16px] font-semibold tabular-nums ${professorScoreTone(category.score)}`}
                >
                  {category.score.toFixed(1)}
                </span>
                {clickable ? (
                  <ChevronRight size={17} className="text-ink-400" />
                ) : (
                  <span />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <ProfessorCommentsTable
        key={subject.key}
        comments={comments}
        categories={categories}
        defaultSubject={subject.name}
      />
    </>
  )
}
