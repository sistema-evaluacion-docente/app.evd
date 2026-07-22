import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInView } from '@/shared/hooks/useInView'
import { Badge, PageHeader } from '@/shared/ui'
import { useState } from 'react'

import { useProfessorSummary } from '../../hooks/useProfessorSummary'
import { ProfessorCategoryChart } from './ProfessorCategoryChart'
import { ProfessorCategoryDetail } from './ProfessorCategoryDetail'
import { ProfessorCategoryDetailSkeleton } from './ProfessorCategoryDetailSkeleton'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'
import { ProfessorCommentsTableSkeleton } from './ProfessorCommentsTableSkeleton'
import { ProfessorHistoryChart } from './ProfessorHistoryChart'
import { ProfessorResultCard } from './ProfessorResultCard'
import { ProfessorSummarySkeleton } from './ProfessorSummarySkeleton'
import { StateCard } from './StateCard'

export function ProfessorSummaryContent() {
  const { ref: commentsRef, isInView: commentsVisible } = useInView({ rootMargin: '500px' })
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const {
    teacherId,
    hasTeacherId,
    periods,
    history,
    period,
    setPeriodValue,
    summary,
    isLoading,
    isCommentsLoading,
    isError,
  } = useProfessorSummary({ commentsEnabled: commentsVisible || categoryId !== null })

  const selectedCategory =
    categoryId && summary
      ? summary.categories.find((category) => category.id === categoryId)
      : undefined

  const periodCode = period?.code ?? ''

  let content: React.ReactNode
  if (!hasTeacherId) {
    content = (
      <StateCard>
        Su usuario no esta vinculado a un registro de docente, por lo que no es posible consultar
        sus evaluaciones. Contacte al administrador del sistema.
      </StateCard>
    )
  } else if (isLoading) {
    content = <ProfessorSummarySkeleton />
  } else if (isError) {
    content = (
      <StateCard>Ocurrio un error al cargar sus resultados. Intente de nuevo mas tarde.</StateCard>
    )
  } else if (!period) {
    content = (
      <StateCard>
        Aun no tiene evaluaciones registradas. Cuando se cargue una evaluacion de un periodo
        academico, sus resultados apareceran aqui.
      </StateCard>
    )
  } else if (summary) {
    content = (
      <>
        <ProfessorResultCard summary={summary} periodValue={periodCode} />
        <ProfessorCategoryChart categories={summary.categories} onSelect={setCategoryId} />
        <ProfessorHistoryChart data={history} />
        {isCommentsLoading && summary.comments.length === 0 ? (
          <ProfessorCommentsTableSkeleton />
        ) : (
          <ProfessorCommentsTable comments={summary.comments} />
        )}
      </>
    )
  } else {
    content = <StateCard>No hay resultados disponibles para el periodo seleccionado.</StateCard>
  }

  return (
    <>
      {selectedCategory && summary ? (
        <ProfessorCategoryDetail
          category={selectedCategory}
          categories={summary.categories}
          comments={summary.comments}
          periodValue={periodCode}
          teacherId={teacherId}
          periods={periods}
          onBack={() => setCategoryId(null)}
          onSelect={setCategoryId}
        />
      ) : categoryId && isLoading ? (
        <ProfessorCategoryDetailSkeleton />
      ) : (
        <>
          <PageHeader
            title={
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
                Mi Resumen de Evaluacion
                {periodCode && (
                  <Badge variant="info" className="h-7 px-3 text-xs tracking-normal normal-case">
                    Semestre {periodCode}
                  </Badge>
                )}
              </span>
            }
            actions={
              periods.length > 0 ? (
                <div className="w-full sm:w-70 flex">
                  <Label htmlFor="professor-period">Periodo academico</Label>

                  <Select
                    items={periods}
                    value={period?.value ?? null}
                    onValueChange={(value) => {
                      if (value) {
                        setPeriodValue(value)
                        setCategoryId(null)
                      }
                    }}
                  >
                    <SelectTrigger id="professor-period" className="mt-1.5 h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent alignItemWithTrigger={false}>
                      {periods.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : undefined
            }
          />

          {content}
        </>
      )}

      <div ref={commentsRef} />
    </>
  )
}
