import { ChevronRight } from 'lucide-react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Card } from '@/shared/ui'

import { professorScoreTone, type ProfessorCategory } from '../model/data'

export interface ProfessorCategoryChartProps {
  categories: ProfessorCategory[]
  onSelect: (categoryId: string) => void
}

const GRID_LINES = [20, 40, 60, 80]
const ROW_GRID = 'grid-cols-[minmax(150px,250px)_1fr_64px_20px]'

/** Horizontal bar per category, with the department average as a marker. */
export function ProfessorCategoryChart({ categories, onSelect }: ProfessorCategoryChartProps) {
  return (
    <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
      <h2 className="text-[18px] font-semibold text-ink-900">
        Calificación por categoría
      </h2>
      <p className="mt-1 text-[13.5px] text-ink-500">
        Seleccione una categoría para ver el desglose de preguntas y sus comentarios.
      </p>

      <div className="mt-4 flex flex-col">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-label={`Ver detalle de ${category.name}`}
            className={`-mx-2.5 grid ${ROW_GRID} min-h-13 cursor-pointer items-center gap-4 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-ink-50/60`}
          >
            <span className="text-[14px] font-medium text-ink-700">
              {category.name}
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
                style={{ width: `${(category.score / 5) * 100}%` }}
              />
              <HoverCard delay={150} closeDelay={80}>
                <HoverCardTrigger
                  render={
                    <span
                      className="absolute -inset-y-1 -ml-[5px] flex w-[11px] justify-center"
                      style={{ left: `${(category.deptScore / 5) * 100}%` }}
                    />
                  }
                >
                  <span className="h-full w-0.5 rounded-full bg-ink-600" />
                </HoverCardTrigger>
                <HoverCardContent side="top" sideOffset={8} className="w-auto min-w-52 p-3.5">
                  <p className="text-[12.5px] font-medium text-ink-500">
                    Promedio del departamento
                  </p>
                  <p className="num mt-1 text-[20px] font-semibold tabular-nums text-ink-900">
                    {category.deptScore.toFixed(1)}
                    <span className="text-[13px] font-normal text-ink-400"> / 5.0</span>
                  </p>
                  <p className="mt-1.5 border-t border-ink-100 pt-1.5 text-[12.5px] text-ink-600">
                    Su calificación:{' '}
                    <span
                      className={`num font-semibold tabular-nums ${professorScoreTone(category.score)}`}
                    >
                      {category.score.toFixed(1)}
                    </span>{' '}
                    <span className="num tabular-nums text-ink-500">
                      ({category.score >= category.deptScore ? '+' : ''}
                      {(category.score - category.deptScore).toFixed(1)})
                    </span>
                  </p>
                </HoverCardContent>
              </HoverCard>
            </span>
            <span
              className={`num text-right text-[16px] font-semibold tabular-nums ${professorScoreTone(category.score)}`}
            >
              {category.score.toFixed(1)}
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

      <div className="mt-3.5 flex flex-wrap items-center gap-5 border-t border-ink-100 pt-3.5">
        <span className="inline-flex items-center gap-2 text-[13px] text-ink-700">
          <span className="size-3.5 rounded-sm bg-blue-300" />
          Su calificación
        </span>
        <span className="inline-flex items-center gap-2 text-[13px] text-ink-700">
          <span className="h-3.5 w-0.5 rounded-full bg-ink-600" />
          Promedio del departamento
        </span>
      </div>
    </Card>
  )
}
