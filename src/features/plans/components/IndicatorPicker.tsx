import { useState } from 'react'
import { AlertTriangle, Check, ChevronRight } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getScoreToneClass } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'
import { indicatorKey } from '../lib/planStatus'
import type { IndicatorDimension, PlanCandidate, TargetType } from '../types'

export interface IndicatorSelection {
  target_type: TargetType
  target_ref: string | null
  label: string
  average: number | null
  /** The aspect (1-5) the indicator belongs to, so the form groups it right. */
  aspect: number | null
  suggestions: string[]
}

interface IndicatorPickerProps {
  candidate: PlanCandidate
  /** Institutional threshold under which an indicator counts as weak. */
  threshold: number
  /** target keys already added as commitments, to render them as picked. */
  selectedKeys: Set<string>
  onSelect: (selection: IndicatorSelection) => void
  /** Maps a dimension name to its aspect number (1-4). */
  aspectByDimension: Record<string, number>
}

/**
 * Indicator matrix of a teacher, grouped by the four evaluation dimensions.
 *
 * Every indicator is listed — the director is the one who decides who needs a
 * plan — but the ones under the institutional threshold are flagged in red/amber
 * and can be isolated with the "solo indicadores bajos" switch.
 *
 * @example
 * <IndicatorPicker candidate={candidate} threshold={3.5} selectedKeys={keys} onSelect={add} />
 */
export function IndicatorPicker({
  candidate,
  threshold,
  selectedKeys,
  onSelect,
  aspectByDimension,
}: IndicatorPickerProps) {
  const [onlyWeak, setOnlyWeak] = useState(true)

  const weakCount = candidate.dimensions.reduce(
    (total, dimension) =>
      total +
      (dimension.below_threshold ? 1 : 0) +
      dimension.questions.filter((q) => q.below_threshold).length,
    0,
  )

  return (
    <div className="space-y-4">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
          <p className="text-sm">
            <span className="num font-semibold">{weakCount}</span>{' '}
            {weakCount === 1 ? 'indicador' : 'indicadores'} por debajo de{' '}
            <span className="num font-semibold">{threshold.toFixed(1)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="only-weak" checked={onlyWeak} onCheckedChange={setOnlyWeak} />
          <Label htmlFor="only-weak" className="text-muted-foreground cursor-pointer font-normal">
            Solo indicadores bajos
          </Label>
        </div>
      </div>

      {candidate.dimensions.map((dimension) => (
        <DimensionBlock
          key={dimension.target_ref}
          dimension={dimension}
          onlyWeak={onlyWeak}
          selectedKeys={selectedKeys}
          onSelect={onSelect}
          aspect={aspectByDimension[dimension.dimension] ?? null}
        />
      ))}
    </div>
  )
}

function DimensionBlock({
  dimension,
  onlyWeak,
  selectedKeys,
  onSelect,
  aspect,
}: {
  dimension: IndicatorDimension
  onlyWeak: boolean
  selectedKeys: Set<string>
  onSelect: (selection: IndicatorSelection) => void
  aspect: number | null
}) {
  const questions = onlyWeak
    ? dimension.questions.filter((q) => q.below_threshold)
    : dimension.questions

  // With the filter on, hide dimensions that have nothing weak in them.
  if (onlyWeak && !dimension.below_threshold && questions.length === 0) return null

  const dimensionKey = indicatorKey('DIMENSION', dimension.target_ref)

  return (
    <Collapsible defaultOpen className="border-border rounded-md border">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <CollapsibleTrigger className="group flex flex-1 cursor-pointer items-center gap-2 text-left">
          <ChevronRight
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{dimension.dimension}</span>
          {dimension.below_threshold && (
            <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Bajo
            </Badge>
          )}
        </CollapsibleTrigger>

        <div className="flex items-center gap-3">
          <ScoreBadge value={dimension.average ?? undefined} />
          <PickButton
            picked={selectedKeys.has(dimensionKey)}
            onClick={() =>
              onSelect({
                target_type: 'DIMENSION',
                target_ref: dimension.target_ref,
                label: dimension.dimension,
                average: dimension.average,
                aspect,
                suggestions: dimension.suggestions,
              })
            }
          />
        </div>
      </div>

      <CollapsibleContent>
        <ul className="divide-border border-border divide-y border-t">
          {questions.map((question) => {
            const key = indicatorKey('QUESTION', question.target_ref)

            return (
              <li
                key={question.target_ref}
                className="flex items-center justify-between gap-3 px-4 py-2.5 pl-10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="text-muted-foreground num mr-1.5">
                      {question.code}
                    </span>
                    {question.text}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      'num text-sm font-semibold',
                      question.average != null
                        ? getScoreToneClass(question.average)
                        : 'text-muted-foreground',
                    )}
                  >
                    {question.average != null ? question.average.toFixed(2) : '—'}
                  </span>
                  <PickButton
                    picked={selectedKeys.has(key)}
                    onClick={() =>
                      onSelect({
                        target_type: 'QUESTION',
                        target_ref: question.target_ref,
                        label: `${question.code} · ${question.text}`,
                        average: question.average,
                        aspect,
                        suggestions: question.suggestions,
                      })
                    }
                  />
                </div>
              </li>
            )
          })}

          {questions.length === 0 && (
            <li className="text-muted-foreground px-4 py-2.5 pl-10 text-sm">
              Sin preguntas por debajo del umbral.
            </li>
          )}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PickButton({ picked, onClick }: { picked: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={picked ? 'secondary' : 'outline'}
      onClick={onClick}
      disabled={picked}
    >
      {picked ? (
        <>
          <Check className="size-3.5" aria-hidden="true" />
          Agregado
        </>
      ) : (
        'Agregar'
      )}
    </Button>
  )
}
