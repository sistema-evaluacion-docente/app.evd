import { AlertTriangle, ClipboardList, Info, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface CasesSummaryProps {
  /** Comments classified as high risk. */
  highRiskComments: number
  /** Improvement plans started, whatever their status. */
  plansTotal: number
  /** Comments whose risk level the director changed. Omit to hide the figure. */
  reclassifiedByDirector?: number
  /** Explains a zero that doesn't mean "no problems" (evaluations not analysed yet). */
  note?: string
  className?: string
}

/**
 * The counts of "reported cases" of a department, a faculty or the
 * university in one period: high-risk comments and improvement plans started.
 * Counts only — the detail (which comments, which plans, which teachers)
 * belongs to the department director, so nothing here links to it. The
 * director figure says "reclassified", not "reviewed": the backend only
 * marks a comment when the director changes its level, not when they agree
 * with it.
 *
 * @example
 * <CasesSummary highRiskComments={12} plansTotal={3} reclassifiedByDirector={5} />
 */
export function CasesSummary({
  highRiskComments,
  plansTotal,
  reclassifiedByDirector,
  note,
  className,
}: CasesSummaryProps) {
  return (
    <section
      className={cn('border-border bg-background overflow-hidden rounded-md border', className)}
    >
      <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
        Casos reportados
      </h2>

      <div
        className={cn(
          'divide-border grid grid-cols-1 divide-y sm:divide-x sm:divide-y-0',
          reclassifiedByDirector != null ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        <Fact icon={<AlertTriangle />} label="Comentarios de riesgo alto" value={highRiskComments} />

        <Fact icon={<ClipboardList />} label="Planes de mejoramiento iniciados" value={plansTotal} />

        {reclassifiedByDirector != null && (
          <Fact
            icon={<Pencil />}
            label="Reclasificados por el director"
            value={reclassifiedByDirector}
            hint="Comentarios cuyo nivel de riesgo el director cambió"
          />
        )}
      </div>

      {note && (
        <p className="text-muted-foreground bg-muted/40 border-border flex items-start gap-2 border-t px-6 py-3 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {note}
        </p>
      )}
    </section>
  )
}

function Fact({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-6 py-4">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase [&_svg]:size-3.5">
        {icon}
        {label}
      </p>

      <span className="text-3xl font-semibold tabular-nums">{value}</span>

      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  )
}
