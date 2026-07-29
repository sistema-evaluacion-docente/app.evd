import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'

import { useCategoryHistory } from '../../hooks/useCategoryHistory'
import type { ProfessorCategory, ProfessorPeriod } from '../../model/professorSummary'
import { ProfessorCategoryItemsTable } from './ProfessorCategoryItemsTable'
import { RangeSelect } from './RangeSelect'
import { useRangeFilter } from './useRangeFilter'

export interface ProfessorCategoryComparisonProps {
  category: ProfessorCategory
  teacherId: number
  periods: ProfessorPeriod[]
}

export function ProfessorCategoryComparison({
  category,
  teacherId,
  periods,
}: ProfessorCategoryComparisonProps) {
  const { points, items, isLoading, isError } = useCategoryHistory(teacherId, periods, category.id)

  const { range, setRange, visible: visiblePoints } = useRangeFilter(points)

  const { visibleItems, visiblePeriods } = useMemo(() => {
    const codes = new Set(visiblePoints.map((point) => point.code))

    return {
      visiblePeriods: visiblePoints.map((point) => ({
        code: point.code,
        name: point.name,
      })),
      visibleItems: items
        .map((item) => ({
          ...item,
          byPeriod: item.byPeriod.filter((entry) => codes.has(entry.code)),
        }))
        .filter((item) => item.byPeriod.length > 0),
    }
  }, [items, visiblePoints])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Comparacion con semestres anteriores</CardTitle>

          <p className="text-muted-foreground mt-1 text-sm">
            Su nota en «{category.name}» frente al promedio de los docentes, semestre a semestre.
          </p>
        </div>

        <RangeSelect
          totalItems={points.length}
          value={range}
          onChange={setRange}
          className="w-full sm:w-56"
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="bg-muted mt-5 h-60 w-full animate-pulse rounded-lg" />
        ) : isError ? (
          <div className="text-muted-foreground mt-5 flex h-60 items-center justify-center text-sm">
            No se pudo cargar el historial de esta categoría.
          </div>
        ) : points.length === 0 ? (
          <div className="text-muted-foreground mt-5 flex h-60 items-center justify-center text-sm">
            Sin historial disponible
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="rounded">
              <ProfessorCategoryItemsTable items={visibleItems} periods={visiblePeriods} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
