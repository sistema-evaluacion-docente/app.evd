import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInView } from '@/shared/hooks/useInView'
import { PageHeader } from '@/shared/ui'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'wouter'

import { Stagger } from '@/components/common/stagger'
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
  const [searchParams, setSearchParams] = useSearchParams()

  const urlPeriod = searchParams.get('period')

  const {
    teacherId,
    hasTeacherId,
    periods,
    history,
    period,
    summary,
    isLoading,
    isCommentsLoading,
    isError,
  } = useProfessorSummary({
    commentsEnabled: commentsVisible || categoryId !== null,
    periodValue: urlPeriod,
  })

  useEffect(() => {
    if (period && period.code !== urlPeriod) {
      setSearchParams((prev) => ({ ...prev, period: period.code }))
    }
  }, [period, urlPeriod, setSearchParams])

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
        <Stagger delay={0}>
          <ProfessorResultCard summary={summary} periodValue={periodCode} />
        </Stagger>

        <Stagger delay={80}>
          <ProfessorCategoryChart categories={summary.categories} onSelect={setCategoryId} />
        </Stagger>

        <Stagger delay={160}>
          <ProfessorHistoryChart data={history} />
        </Stagger>

        <Stagger delay={240}>
          {isCommentsLoading && summary.comments.length === 0 ? (
            <ProfessorCommentsTableSkeleton />
          ) : (
            <ProfessorCommentsTable comments={summary.comments} />
          )}
        </Stagger>
      </>
    )
  } else {
    content = <StateCard>No hay resultados disponibles para el periodo seleccionado.</StateCard>
  }

  return (
    <>
      {selectedCategory && summary ? (
        <Stagger delay={0}>
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
        </Stagger>
      ) : categoryId && isLoading ? (
        <ProfessorCategoryDetailSkeleton />
      ) : (
        <>
          <PageHeader
            title={
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
                Resultados de Evaluacion
                {periodCode && (
                  <Badge variant="outline" className="h-7 px-3 text-xs tracking-normal normal-case">
                    Semestre {periodCode}
                  </Badge>
                )}
              </span>
            }
            actions={
              periods.length > 0 ? (
                <div className="flex w-full items-center gap-2 sm:w-70">
                  <Label htmlFor="professor-period">Periodo</Label>

                  <Select
                    items={periods}
                    value={period?.code ?? null}
                    onValueChange={(value) => {
                      if (value) {
                        setSearchParams((prev) => ({ ...prev, period: value }))
                        setCategoryId(null)
                      }
                    }}
                  >
                    <SelectTrigger id="professor-period" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent alignItemWithTrigger={false}>
                      {periods.map((item) => (
                        <SelectItem key={item.value} value={item.code}>
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
