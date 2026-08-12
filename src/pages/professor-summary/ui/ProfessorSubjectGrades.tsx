import { ChevronRight } from 'lucide-react'

import { Card } from '@/shared/ui'

import { professorScoreTone, type ProfessorSubject } from '../model/data'

export interface ProfessorSubjectGradesProps {
  subjects: ProfessorSubject[]
  onSelect: (subjectKey: string) => void
  isLoading?: boolean
}

const GRID_LINES = [20, 40, 60, 80]
const ROW_GRID = 'grid-cols-[minmax(150px,260px)_1fr_56px_20px]'

/** "Notas por materia": one clickable row per subject with its overall grade.
 * Subjects have no department benchmark, so no comparison marker is shown. */
export function ProfessorSubjectGrades({
  subjects,
  onSelect,
  isLoading,
}: ProfessorSubjectGradesProps) {
  if (isLoading) {
    return (
      <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
        <div className="h-5 w-44 animate-pulse rounded bg-ink-100" />
        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-9 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      </Card>
    )
  }

  if (subjects.length === 0) return null

  return (
    <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
      <h2 className="text-[18px] font-semibold text-ink-900">Notas por materia</h2>
      <p className="mt-1 text-[13.5px] text-ink-500">
        Su promedio en cada asignatura. Seleccione una materia para ver el desglose por
        categoría y sus comentarios.
      </p>

      <div className="mt-4 flex flex-col">
        {subjects.map((subject) => (
          <button
            key={subject.key}
            type="button"
            onClick={() => onSelect(subject.key)}
            aria-label={`Ver detalle de ${subject.name}`}
            className={`-mx-2.5 grid ${ROW_GRID} min-h-14 cursor-pointer items-center gap-4 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-ink-50/60`}
          >
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium text-ink-700">
                {subject.name}
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-ink-400">
                {subject.group}
              </span>
            </span>
            <span className="relative block h-6 rounded-md bg-ink-100">
              {GRID_LINES.map((line) => (
                <span
                  key={line}
                  className="absolute inset-y-0 w-px bg-ink-200/70"
                  style={{ left: `${line}%` }}
                />
              ))}
              <span
                className="absolute inset-y-0 left-0 rounded-md bg-blue-300"
                style={{ width: `${(subject.score / 5) * 100}%` }}
              />
            </span>
            <span
              className={`num text-right text-[16px] font-semibold tabular-nums ${professorScoreTone(subject.score)}`}
            >
              {subject.score.toFixed(1)}
            </span>
            <ChevronRight size={17} className="text-ink-400" />
          </button>
        ))}

        <div className={`grid ${ROW_GRID} gap-4 pt-1.5`}>
          <span />
          <span className="num flex justify-between text-[12px] tabular-nums text-ink-400">
            {[0, 1, 2, 3, 4, 5].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </span>
          <span />
          <span />
        </div>
      </div>
    </Card>
  )
}
