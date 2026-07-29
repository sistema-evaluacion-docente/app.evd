import { ProfessorSummaryContent } from '@/features/teachers'
import { AppLayout } from '@/widgets/layout'
import { useParams } from 'wouter'

export function ProfessorSummaryPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <AppLayout>
      <ProfessorSummaryContent evaluationId={id} />
    </AppLayout>
  )
}
