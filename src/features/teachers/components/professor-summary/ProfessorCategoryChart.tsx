import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle>Desglose de categorias</CardTitle>

        <p className="text-muted-foreground mt-1 text-sm">
          Seleccione una categoria para ver el desglose de preguntas.
        </p>
      </CardHeader>

      <CardContent>
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

              <span className="bg-border relative block h-6 rounded-md">
                {GRID_LINES.map((line) => (
                  <span
                    key={line}
                    className="bg-border/70 absolute inset-y-0 w-px"
                    style={{ left: `${line}%` }}
                  />
                ))}

                <span
                  className="bg-primary/80 absolute inset-y-0 left-0 rounded-md"
                  style={{ width: `${(category.score / 5) * 100}%` }}
                />
              </span>

              <span
                className={`num text-right text-base font-semibold tabular-nums ${professorScoreTone(category.score)}`}
              >
                {category.score.toFixed(2)}
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
      </CardContent>
    </Card>
  )
}
