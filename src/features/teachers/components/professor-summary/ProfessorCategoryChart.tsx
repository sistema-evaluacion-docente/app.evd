import { Card } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ChevronRight } from 'lucide-react'

import { professorScoreTone, type ProfessorCategory } from '../../model/professorSummary'

export interface ProfessorCategoryChartProps {
  categories: ProfessorCategory[]
  onSelect: (categoryId: string) => void
}

const GRID_LINES = [20, 40, 60, 80]
const ROW_GRID = 'grid-cols-[minmax(150px,250px)_1fr_64px_20px]'

export function ProfessorCategoryChart({ categories, onSelect }: ProfessorCategoryChartProps) {
  return (
    <Card className="p-6 pb-5 sm:p-7 sm:pb-5">
      <h2 className="text-foreground text-lg font-semibold">Calificacion por categoria</h2>

      <p className="text-muted-foreground mt-1 text-sm">
        Seleccione una categoria para ver el desglose de preguntas y sus comentarios.
      </p>

      <div className="mt-4 flex flex-col">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-label={`Ver detalle de ${category.name}`}
            className={`-mx-2.5 grid ${ROW_GRID} hover:bg-muted/60 min-h-13 cursor-pointer items-center gap-4 rounded-md px-2.5 py-2 text-left transition-colors`}
          >
            <span className="text-foreground/80 text-sm font-medium">{category.name}</span>

            <span className="bg-muted relative block h-6 rounded-md">
              {GRID_LINES.map((line) => (
                <span
                  key={line}
                  className="bg-border/70 absolute inset-y-0 w-px"
                  style={{ left: `${line}%` }}
                />
              ))}

              <span
                className="bg-primary/40 absolute inset-y-0 left-0 rounded-md"
                style={{ width: `${(category.score / 5) * 100}%` }}
              />

              <HoverCard>
                <HoverCardTrigger
                  delay={150}
                  closeDelay={80}
                  render={
                    <span
                      className="absolute -inset-y-1 -ml-1.25 flex w-2.75 justify-center"
                      style={{ left: `${(category.deptScore / 5) * 100}%` }}
                    />
                  }
                >
                  <span className="bg-foreground/60 h-full w-0.5 rounded-full" />
                </HoverCardTrigger>

                <HoverCardContent side="top" sideOffset={8} className="w-auto min-w-52 p-3.5">
                  <p className="text-muted-foreground text-xs font-medium">
                    Promedio del departamento
                  </p>

                  <p className="num text-foreground mt-1 text-xl font-semibold tabular-nums">
                    {category.deptScore.toFixed(1)}
                    <span className="text-muted-foreground text-sm font-normal"> / 5.0</span>
                  </p>

                  <p className="border-border text-foreground/70 mt-1.5 border-t pt-1.5 text-xs">
                    Su calificacion:{' '}
                    <span
                      className={`num font-semibold tabular-nums ${professorScoreTone(category.score)}`}
                    >
                      {category.score.toFixed(1)}
                    </span>{' '}
                    <span className="num text-muted-foreground tabular-nums">
                      ({category.score >= category.deptScore ? '+' : ''}
                      {(category.score - category.deptScore).toFixed(1)})
                    </span>
                  </p>
                </HoverCardContent>
              </HoverCard>
            </span>

            <span
              className={`num text-right text-base font-semibold tabular-nums ${professorScoreTone(category.score)}`}
            >
              {category.score.toFixed(1)}
            </span>

            <ChevronRight size={17} className="text-muted-foreground" />
          </button>
        ))}

        <div className={`grid ${ROW_GRID} gap-4 pt-1.5`}>
          <span />

          <span className="num text-muted-foreground flex justify-between text-xs tabular-nums">
            {[0, 1, 2, 3, 4, 5].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </span>

          <span />
          <span />
        </div>
      </div>

      <div className="border-border mt-3.5 flex flex-wrap items-center gap-5 border-t pt-3.5">
        <span className="text-foreground/80 inline-flex items-center gap-2 text-sm">
          <span className="bg-primary/40 size-3.5 rounded-sm" />
          Su calificacion
        </span>

        <span className="text-foreground/80 inline-flex items-center gap-2 text-sm">
          <span className="bg-foreground/60 h-3.5 w-0.5 rounded-full" />
          Promedio del departamento
        </span>
      </div>
    </Card>
  )
}
