import { Badge, Card, DataTable, type DataTableColumn } from '@/shared/ui'

import { PROFESSOR_RISK_BADGE, type ProfessorComment } from '../model/data'

export interface ProfessorCommentsTableProps {
  comments: ProfessorComment[]
}

/** All the period's student comments, tagged by category and risk level. */
export function ProfessorCommentsTable({ comments }: ProfessorCommentsTableProps) {
  const columns: DataTableColumn<ProfessorComment>[] = [
    {
      header: 'Comentario',
      cellClassName: 'align-top py-4 max-w-[540px]',
      cell: (comment) => (
        <p
          className="text-[13.5px] leading-relaxed text-ink-800"
          style={{ textWrap: 'pretty' }}
        >
          <span className="text-ink-400">“</span>
          {comment.text}
          <span className="text-ink-400">”</span>
        </p>
      ),
    },
    {
      header: 'Asignatura',
      cellClassName: 'align-top py-4 whitespace-nowrap',
      cell: (comment) => (
        <span className="text-[13px] text-ink-700">{comment.subject}</span>
      ),
    },
    {
      header: 'Categoría',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-ink-200 bg-ink-50/60 px-2.5 text-[11px] font-medium text-ink-700">
          {comment.categoryName}
        </span>
      ),
    },
    {
      header: 'Nivel de riesgo',
      cellClassName: 'align-top py-4',
      cell: (comment) => {
        const badge = PROFESSOR_RISK_BADGE[comment.risk]
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={badge.variant} className="min-w-16 justify-center">
              {badge.label}
            </Badge>
            <span className="num text-[11.5px] tabular-nums text-ink-500">
              {comment.confidence}% confianza
            </span>
          </div>
        )
      },
    },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:p-7 sm:pb-4">
        <div>
          <h2 className="text-[18px] font-semibold text-ink-900">
            Comentarios de estudiantes
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Todos los comentarios del periodo, clasificados por categoría y nivel de
            riesgo.
          </p>
        </div>
        <span className="num shrink-0 text-[13.5px] font-medium tabular-nums text-ink-500">
          {comments.length} comentarios
        </span>
      </div>
      <DataTable
        columns={columns}
        rows={comments}
        rowKey={(comment) => comment.id}
        headerVariant="muted"
        minWidth={760}
        emptyMessage="No hay comentarios en el periodo seleccionado."
      />
    </Card>
  )
}
