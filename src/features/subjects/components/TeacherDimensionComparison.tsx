import { BarChart3, ChevronRight, List } from 'lucide-react'
import { useState } from 'react'

import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { TeacherComparisonDimension, TeacherComparisonEntry } from '@/features/stats'
import { dimensionColor } from '@/lib/dimensionLabel'
import { comparisonEntryKey } from '../config'

export interface TeacherDimensionComparisonProps {
  entries: TeacherComparisonEntry[]
  colorByKey: Map<string, string>
  className?: string
}

interface DimensionRow {
  entry: TeacherComparisonEntry
  dimension: TeacherComparisonDimension | undefined
}

type DimensionViewMode = 'list' | 'chart'

/**
 * One card per pedagogical dimension, each listing every teacher in the
 * *same fixed order* (never re-sorted per dimension) so the director can
 * track one teacher's row down the page without re-scanning — color and
 * position both stay tied to the teacher, never to their rank. A best/worst
 * badge at the top of each card surfaces the extremes without relying on
 * list order, and a collapsible table below breaks the dimension down by
 * individual indicator. A toggle lets the director switch every card between
 * a compact row list (comfortable with several teachers) and a vertical bar
 * chart.
 *
 * @example
 * <TeacherDimensionComparison entries={entries} colorByKey={colorByKey} />
 */
export function TeacherDimensionComparison({
  entries,
  colorByKey,
  className,
}: TeacherDimensionComparisonProps) {
  const [viewMode, setViewMode] = useState<DimensionViewMode>('list')

  const orderedEntries = [...entries].sort(
    (a, b) => a.teacher_id - b.teacher_id || a.group_name.localeCompare(b.group_name),
  )

  const dimensionNames = orderedEntries[0]?.dimensions.map((dimension) => dimension.dimension) ?? []

  if (dimensionNames.length === 0) return null

  // Past a handful of teachers, a vertical bar chart needs the full card
  // width to keep every bar and its label legible — two side-by-side charts
  // get too cramped. The row-list view doesn't have this problem, so it
  // keeps the two-column layout regardless of how many teachers there are.
  const manyTeachers = orderedEntries.length > 4
  const gridClassName =
    viewMode === 'chart' && manyTeachers ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Comparación por dimensión pedagógica
        </h2>

        <div
          role="group"
          aria-label="Forma de ver la comparación"
          className="border-border inline-flex shrink-0 gap-0.5 rounded-md border p-0.5"
        >
          <Button
            type="button"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <List className="size-3.5" aria-hidden="true" />
            Lista
          </Button>

          <Button
            type="button"
            variant={viewMode === 'chart' ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={viewMode === 'chart'}
            onClick={() => setViewMode('chart')}
          >
            <BarChart3 className="size-3.5" aria-hidden="true" />
            Barras
          </Button>
        </div>
      </div>

      <div className={gridClassName}>
        {dimensionNames.map((dimensionName) => (
          <DimensionCard
            key={dimensionName}
            dimensionName={dimensionName}
            entries={orderedEntries}
            colorByKey={colorByKey}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Shortens a name to its first two words — first name + first surname for
 * the common "Nombre Apellido1 Apellido2" shape — for the chart's X-axis
 * labels, where several full names side by side leave no room to render the
 * ones in the middle. Names of two words or fewer are returned unchanged.
 *
 * @example
 * shortTeacherName('Juan Pérez Gómez') // 'Juan Pérez'
 */
function shortTeacherName(name: string): string {
  const parts = name.trim().split(/\s+/)

  return parts.length <= 2 ? name : `${parts[0]} ${parts[1]}`
}

function DimensionCard({
  dimensionName,
  entries,
  colorByKey,
  viewMode,
}: {
  dimensionName: string
  entries: TeacherComparisonEntry[]
  colorByKey: Map<string, string>
  viewMode: DimensionViewMode
}) {
  const rows: DimensionRow[] = entries.map((entry) => ({
    entry,
    dimension: entry.dimensions.find((dimension) => dimension.dimension === dimensionName),
  }))

  const scoredRows = rows.filter(
    (row): row is DimensionRow & { dimension: TeacherComparisonDimension & { average: number } } =>
      row.dimension?.average != null,
  )

  const best = scoredRows.reduce<(typeof scoredRows)[number] | undefined>(
    (top, row) => (!top || row.dimension.average > top.dimension.average ? row : top),
    undefined,
  )

  const worst = scoredRows.reduce<(typeof scoredRows)[number] | undefined>(
    (bottom, row) => (!bottom || row.dimension.average < bottom.dimension.average ? row : bottom),
    undefined,
  )

  return (
    <section className="border-border bg-background rounded-md border">
      <div className="border-border flex items-center gap-2 border-b px-5 py-3">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: dimensionColor(dimensionName) }}
        />
        <h3 className="text-sm font-semibold">{dimensionName}</h3>
      </div>

      {best && worst && best.entry !== worst.entry && (
        <div className="border-border text-muted-foreground border-b px-5 py-2 text-xs">
          <p>
            <span className="font-medium text-green-600 dark:text-green-400">Mejor:</span>{' '}
            {best.entry.teacher_name} ({best.dimension.average.toFixed(2)})
          </p>
          <p>
            <span className="font-medium text-amber-600 dark:text-amber-400">Menor nota:</span>{' '}
            {worst.entry.teacher_name} ({worst.dimension.average.toFixed(2)})
          </p>
        </div>
      )}

      {viewMode === 'chart' ? (
        <div className="px-5 py-4">
          <DimensionComparisonChart
            series={[
              {
                id: 'average',
                label: 'Promedio',
                scores: rows.map(({ entry, dimension }) => ({
                  dimension: comparisonEntryKey(entry),
                  value: dimension?.average ?? undefined,
                })),
              },
            ]}
            dimensions={rows.map(({ entry }) => ({
              key: comparisonEntryKey(entry),
              label: shortTeacherName(entry.teacher_name),
              color: colorByKey.get(comparisonEntryKey(entry)),
            }))}
            orientation="vertical"
            colorByDimension
            showLegend={false}
            customizable={false}
            min={0}
            max={5}
            chartClassName="h-56"
          />
        </div>
      ) : (
        <div className="space-y-3 px-5 py-4">
          {rows.map(({ entry, dimension }) => (
            <div key={comparisonEntryKey(entry)}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{entry.teacher_name}</span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {dimension?.average != null ? dimension.average.toFixed(2) : '—'}
                </span>
              </div>

              {dimension?.average != null ? (
                <ScoreProgress
                  value={dimension.average}
                  color={colorByKey.get(comparisonEntryKey(entry))}
                  label={entry.teacher_name}
                  showTooltip={false}
                  interactive={false}
                />
              ) : (
                <div className="bg-muted h-1 w-full rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}

      <IndicatorsTable rows={rows} colorByKey={colorByKey} />
    </section>
  )
}

function IndicatorsTable({
  rows,
  colorByKey,
}: {
  rows: DimensionRow[]
  colorByKey: Map<string, string>
}) {
  const indicators = rows.find((row) => (row.dimension?.questions.length ?? 0) > 0)?.dimension
    ?.questions

  if (!indicators || indicators.length === 0) return null

  return (
    <Collapsible>
      <CollapsibleTrigger className="border-border text-muted-foreground hover:bg-muted/40 group flex w-full items-center gap-1.5 border-t px-5 py-2.5 text-left text-xs font-medium transition-colors">
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
        />
        Indicadores de desempeño
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-left">
                <th scope="col" className="py-2 pr-2 font-medium">
                  N°
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Indicador
                </th>

                {rows.map(({ entry }) => (
                  <th
                    key={comparisonEntryKey(entry)}
                    scope="col"
                    aria-label={entry.teacher_name}
                    className="px-2 py-2 text-center font-medium"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: colorByKey.get(comparisonEntryKey(entry)) }}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-border divide-y">
              {indicators.map((indicator) => (
                <tr key={indicator.code}>
                  <td className="text-muted-foreground py-2 pr-2 tabular-nums">{indicator.code}</td>
                  <td className="py-2 pr-3">{indicator.text}</td>

                  {rows.map(({ entry, dimension }) => {
                    const score = dimension?.questions.find(
                      (question) => question.code === indicator.code,
                    )?.score

                    return (
                      <td
                        key={comparisonEntryKey(entry)}
                        className="px-2 py-2 text-center tabular-nums"
                      >
                        {score != null ? score.toFixed(1) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
