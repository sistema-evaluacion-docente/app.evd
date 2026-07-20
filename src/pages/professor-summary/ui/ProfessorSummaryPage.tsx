import { useState } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { AppFooter, Card, PageHeader } from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

import { useProfessorSummary } from '../model/useProfessorSummary'
import { ProfessorCategoryChart } from './ProfessorCategoryChart'
import { ProfessorCategoryDetail } from './ProfessorCategoryDetail'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'
import { ProfessorResultCard } from './ProfessorResultCard'

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex min-h-56 items-center justify-center p-8 text-center">
      <div className="text-[14px] text-ink-500">{children}</div>
    </Card>
  )
}

export function ProfessorSummaryPage() {
  const {
    user,
    hasTeacherId,
    periods,
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
        Su usuario no está vinculado a un registro de docente, por lo que no es
        posible consultar sus evaluaciones. Contacte al administrador del sistema.
      </StateCard>
    )
  } else if (isLoading) {
    content = (
      <Card className="flex min-h-56 items-center justify-center p-8">
        <Spinner className="size-6 text-ink-400" />
      </Card>
    )
  } else if (isError) {
    content = (
      <StateCard>
        Ocurrió un error al cargar sus resultados. Intente de nuevo más tarde.
      </StateCard>
    )
  } else if (!period) {
    content = (
      <StateCard>
        Aún no tiene evaluaciones registradas. Cuando se cargue una evaluación de un
        periodo académico, sus resultados aparecerán aquí.
      </StateCard>
    )
  } else if (summary) {
    content = (
      <>
        <ProfessorResultCard summary={summary} periodValue={periodCode} />
        <ProfessorCategoryChart
          categories={summary.categories}
          onSelect={setCategoryId}
        />
        <ProfessorCommentsTable comments={summary.comments} />
      </>
    )
  } else {
    content = (
      <StateCard>
        No hay resultados disponibles para el periodo seleccionado.
      </StateCard>
    )
  }

  return (
    <AppLayout header={{ userName: user?.name ?? '', userRole: 'Docente' }}>
      {selectedCategory && summary ? (
        <ProfessorCategoryDetail
          category={selectedCategory}
          categories={summary.categories}
          periodValue={periodCode}
          onBack={() => setCategoryId(null)}
          onSelect={setCategoryId}
        />
      ) : (
        <>
          <PageHeader
            title="Mi Resumen de Evaluación"
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
        {user?.name ?? ''} · v2.1
      </AppFooter>
    </AppLayout>
  )
}
