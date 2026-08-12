import { PageTitle } from '@/components/common/PageTitle'
import { useSearchParams } from 'wouter'
import { CommentsList } from '../components'

/**
 * Full page listing every comment of a selected academic period, filterable
 * by teacher, risk level, pedagogical category and free text.
 */
export default function CommentsPage() {
  const [searchParams] = useSearchParams()
  const periodName = searchParams.get('period') || 'actual'

  return (
    <>
      <PageTitle>Comentarios {periodName}</PageTitle>

      <CommentsList />
    </>
  )
}
