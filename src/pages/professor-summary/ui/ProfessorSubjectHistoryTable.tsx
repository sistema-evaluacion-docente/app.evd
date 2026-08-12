import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { DataTable, type DataTableColumn } from '@/shared/ui'

import { professorScoreTone, type SubjectGradeHistory } from '../model/data'

export interface ProfessorSubjectHistoryTableProps {
  subjects: SubjectGradeHistory[]
  /** Visible periods, oldest → newest — one column each. */
  periods: { code: string; name: string }[]
}

/** Change between the two most recent semesters a subject was taught. */
function TrendCell({ subject }: { subject: SubjectGradeHistory }) {
  const scores = subject.byPeriod
  if (scores.length < 2) {
    return <span className="text-[13px] text-ink-400">—</span>
  }

  const delta = scores[scores.length - 1].score - scores[scores.length - 2].score
  const isUp = delta > 0.005
  const isDown = delta < -0.005
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus
  const tone = isUp
    ? 'bg-emerald-50 text-emerald-700'
    : isDown
      ? 'bg-red-50 text-red-700'
      : 'bg-ink-100 text-ink-500'

  return (
    <span
      className={`num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ${tone}`}
    >
      <Icon size={12} />
      {delta >= 0 ? '+' : ''}
      {delta.toFixed(2)}
    </span>
  )
}

/** Subject-by-subject overall grade across semesters. */
export function ProfessorSubjectHistoryTable({
  subjects,
  periods,
}: ProfessorSubjectHistoryTableProps) {
  const columns: DataTableColumn<SubjectGradeHistory>[] = [
    {
      header: 'Materia',
      cellClassName: 'align-top py-4',
      cell: (subject) => (
        <div className="max-w-xs">
          <p
            className="text-[13.5px] font-medium leading-normal text-ink-700"
            style={{ textWrap: 'pretty' }}
          >
            {subject.name}
          </p>
          {subject.group && (
            <span className="mt-0.5 block text-[11.5px] text-ink-400">
              {subject.group}
            </span>
          )}
        </div>
      ),
    },
    ...periods.map<DataTableColumn<SubjectGradeHistory>>((period) => ({
      header: period.code,
      headerClassName: 'text-right whitespace-nowrap',
      cellClassName: 'align-top py-4 text-right whitespace-nowrap',
      cell: (subject) => {
        const score = subject.byPeriod.find((entry) => entry.code === period.code)
        if (!score) {
          return <span className="text-[13px] text-ink-400">—</span>
        }
        return (
          <span
            className={`num text-[14px] font-semibold tabular-nums ${professorScoreTone(score.score)}`}
          >
            {score.score.toFixed(2)}
          </span>
        )
      },
    })),
    {
      header: 'Tendencia',
      headerClassName: 'text-right whitespace-nowrap',
      cellClassName: 'align-top py-4 text-right',
      cell: (subject) => <TrendCell subject={subject} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={subjects}
      rowKey={(subject) => subject.key}
      headerVariant="muted"
      minWidth={340 + periods.length * 92 + 110}
      emptyMessage="Sin materias para comparar."
    />
  )
}
