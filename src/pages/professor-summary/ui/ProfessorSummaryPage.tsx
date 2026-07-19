import { useMemo, useState } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppFooter, PageHeader } from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

import { buildProfessorSummary, PROFESSOR_PERIODS } from '../model/data'
import { ProfessorCategoryChart } from './ProfessorCategoryChart'
import { ProfessorCategoryDetail } from './ProfessorCategoryDetail'
import { ProfessorCommentsTable } from './ProfessorCommentsTable'
import { ProfessorResultCard } from './ProfessorResultCard'

const PROFESSOR = { name: 'Dr. Roberto Jiménez', role: 'Docente' }

export function ProfessorSummaryPage() {
  const [periodValue, setPeriodValue] = useState(PROFESSOR_PERIODS[0].value)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const summary = useMemo(() => buildProfessorSummary(periodValue), [periodValue])
  const selectedCategory = categoryId
    ? summary.categories.find((category) => category.id === categoryId)
    : undefined

  return (
    <AppLayout header={{ userName: PROFESSOR.name, userRole: PROFESSOR.role }}>
      {selectedCategory ? (
        <ProfessorCategoryDetail
          category={selectedCategory}
          categories={summary.categories}
          periodValue={periodValue}
          onBack={() => setCategoryId(null)}
          onSelect={setCategoryId}
        />
      ) : (
        <>
          <PageHeader
            title="Mi Resumen de Evaluación"
            description="Resultados de la evaluación de estudiantes a docente en el periodo seleccionado."
            actions={
              <div className="w-full sm:w-70">
                <Label htmlFor="professor-period">Periodo académico</Label>
                <Select
                  items={PROFESSOR_PERIODS}
                  value={periodValue}
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
                    {PROFESSOR_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />

          <ProfessorResultCard summary={summary} periodValue={periodValue} />
          <ProfessorCategoryChart
            categories={summary.categories}
            onSelect={setCategoryId}
          />
          <ProfessorCommentsTable comments={summary.comments} />
        </>
      )}

      <AppFooter>
        Periodo Académico {periodValue} · {PROFESSOR.name} · v2.1
      </AppFooter>
    </AppLayout>
  )
}
