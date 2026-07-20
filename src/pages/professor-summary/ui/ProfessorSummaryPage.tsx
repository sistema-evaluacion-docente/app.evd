import { useState } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppFooter, Badge, Card, PageHeader } from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

import { useProfessorSummary } from '../model/useProfessorSummary'
import { ProfessorCategoryChart } from './ProfessorCategoryChart'
import { ProfessorCategoryDetail } from './ProfessorCategoryDetail'
import { ProfessorCategoryDetailSkeleton } from './ProfessorCategoryDetailSkeleton'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'
import { ProfessorHistoryChart } from './ProfessorHistoryChart'
import { ProfessorResultCard } from './ProfessorResultCard'
import { ProfessorSummarySkeleton } from './ProfessorSummarySkeleton'

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex min-h-56 items-center justify-center p-8 text-center">
      <div className="text-ink-500 text-[14px]">{children}</div>
    </Card>
  )
}

export function ProfessorSummaryPage() {
  const {
    user,
    hasTeacherId,
    periods,
    history,
    period,
    setPeriodValue,
    summary,
    isLoading,
    isError,
  } = useProfessorSummary()

  const [categoryId, setCategoryId] = useState<string | null>(null)

  const selectedCategory =
    categoryId && summary
      ? summary.categories.find((category) => category.id === categoryId)
      : undefined

  const periodCode = period?.code ?? ''

  let content: React.ReactNode
  if (!hasTeacherId) {
    content = (
      <StateCard>
        Su usuario no está vinculado a un registro de docente, por lo que no es posible consultar
        sus evaluaciones. Contacte al administrador del sistema.
      </StateCard>
    )
  } else if (isLoading) {
    content = <ProfessorSummarySkeleton />
  } else if (isError) {
    content = (
      <StateCard>Ocurrió un error al cargar sus resultados. Intente de nuevo más tarde.</StateCard>
    )
  } else if (!period) {
    content = (
      <StateCard>
        Aún no tiene evaluaciones registradas. Cuando se cargue una evaluación de un periodo
        académico, sus resultados aparecerán aquí.
      </StateCard>
    )
  } else if (summary) {
    content = (
      <>
        <ProfessorResultCard summary={summary} periodValue={periodCode} />
        <ProfessorCategoryChart categories={summary.categories} onSelect={setCategoryId} />
        <ProfessorHistoryChart data={history} />
        <ProfessorCommentsTable comments={summary.comments} />
      </>
    )
  } else {
    content = <StateCard>No hay resultados disponibles para el periodo seleccionado.</StateCard>
  }

  return (
    <AppLayout header={{ userName: user?.name ?? '', userRole: 'Docente' }}>
      {selectedCategory && summary ? (
        <ProfessorCategoryDetail
          category={selectedCategory}
          categories={summary.categories}
          comments={summary.comments}
          periodValue={periodCode}
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
                Mi Resumen de Evaluación
                {periodCode && (
                  <Badge
                    variant="info"
                    className="h-6.5 px-3 text-[12px] normal-case tracking-normal"
                  >
                    Semestre {periodCode}
                  </Badge>
                )}
              </span>
            }
            description="Resultados de la evaluación de estudiantes a docente en el periodo seleccionado."
            actions={
              periods.length > 0 ? (
                <div className="w-full sm:w-70">
                  <Label htmlFor="professor-period">Periodo académico</Label>
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

      <AppFooter>
        {periodCode ? `Periodo Académico ${periodCode} · ` : ''}
        v2.1
      </AppFooter>
    </AppLayout>
  )
}
