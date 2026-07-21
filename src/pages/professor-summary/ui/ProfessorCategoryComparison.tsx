import { useMemo, useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/shared/ui'

import type { ProfessorCategory, ProfessorPeriod } from '../model/data'
import { useCategoryHistory } from '../model/useCategoryHistory'
import { ProfessorCategoryHistoryChart } from './ProfessorCategoryHistoryChart'
import { ProfessorCategoryItemsTable } from './ProfessorCategoryItemsTable'

/** Comparison ranges, in number of most-recent semesters. */
const RANGE_OPTIONS = [2, 3, 5] as const

type RangeValue = '2' | '3' | '5' | 'all'

export interface ProfessorCategoryComparisonProps {
  category: ProfessorCategory
  teacherId: number
  periods: ProfessorPeriod[]
}

/** Revealed section: two-line chart + item-by-item table for one category. */
export function ProfessorCategoryComparison({
  category,
  teacherId,
  periods,
}: ProfessorCategoryComparisonProps) {
  const [range, setRange] = useState<RangeValue>('all')
  const { points, items, isLoading, isError } = useCategoryHistory(
    teacherId,
    periods,
    category.id,
  )

  // Only offer a "last N" range when there is more history than N to trim.
  const rangeItems = useMemo(() => {
    const list: { value: RangeValue; label: string }[] = RANGE_OPTIONS.filter(
      (count) => points.length > count,
    ).map((count) => ({
      value: String(count) as RangeValue,
      label: `Últimos ${count} semestres`,
    }))
    list.push({ value: 'all', label: 'Todos los semestres' })
    return list
  }, [points.length])

  const visiblePoints = useMemo(
    () => (range === 'all' ? points : points.slice(-Number(range))),
    [points, range],
  )

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
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-ink-900">
            Comparación con semestres anteriores
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Su nota en «{category.name}» frente al promedio de los docentes, semestre a semestre.
          </p>
        </div>

        {rangeItems.length > 1 && (
          <div className="w-full sm:w-56">
            <Select
              items={rangeItems}
              value={range}
              onValueChange={(value) => {
                if (value) setRange(value as RangeValue)
              }}
            >
              <SelectTrigger aria-label="Rango de comparación" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {rangeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-5 h-60 w-full animate-pulse rounded-lg bg-ink-100" />
      ) : isError ? (
        <div className="mt-5 flex h-60 items-center justify-center text-[14px] text-ink-500">
          No se pudo cargar el historial de esta categoría.
        </div>
      ) : points.length === 0 ? (
        <div className="mt-5 flex h-60 items-center justify-center text-[14px] text-ink-500">
          Sin historial disponible
        </div>
      ) : (
        <>
          <div className="mt-5">
            <ProfessorCategoryHistoryChart data={visiblePoints} />
          </div>

          <div className="mt-7">
            <h3 className="text-[15px] font-semibold text-ink-900">Detalle por pregunta</h3>
            <p className="mt-1 mb-3 text-[13px] text-ink-500">
              Su nota en cada pregunta por semestre y la tendencia respecto al semestre previo.
            </p>
            <ProfessorCategoryItemsTable items={visibleItems} periods={visiblePeriods} />
          </div>
        </>
      )}
    </Card>
  )
}
