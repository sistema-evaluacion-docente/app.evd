import { useGetTeacherComments } from '../api'
import { CommentsPanel, type CommentsPanelProps } from './CommentsPanel'

export interface TeacherCommentsProps extends Omit<
  CommentsPanelProps,
  'courses' | 'isLoading' | 'error'
> {
  /** Evaluation the comments belong to. The query stays idle until it is set. */
  evaluationId?: number
  /** Teacher whose comments are fetched. The query stays idle until it is set. */
  teacherId?: number
}

/**
 * Connected version of `CommentsPanel`: fetches the comments of a teacher for
 * an evaluation and forwards every presentation prop to the panel. Use this
 * when the screen only knows the ids; use `CommentsPanel` directly when the
 * data already lives in the parent.
 *
 * @example
 * <TeacherComments evaluationId={teacher.evaluation_id} teacherId={teacher.teacher_id} />
 *
 * @example
 * <TeacherComments
 *   evaluationId={evaluationId}
 *   teacherId={teacherId}
 *   title="Comentarios de los estudiantes"
 *   groupByCourse={false}
 *   layout="grid"
 *   commentProps={{ showCourse: true, clampLines: 3 }}
 * />
 */
export function TeacherComments({ evaluationId, teacherId, ...panelProps }: TeacherCommentsProps) {
  const { data, isPending, error } = useGetTeacherComments({ evaluationId, teacherId })

  const isIdle = evaluationId == null || teacherId == null

  return (
    <CommentsPanel
      courses={data?.data.courses}
      isLoading={!isIdle && isPending}
      error={error ? error.message : null}
      {...panelProps}
    />
  )
}
