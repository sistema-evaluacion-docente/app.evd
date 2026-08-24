import { MessageSquareDashed } from 'lucide-react'
import type { ReactNode } from 'react'

import { InlineError } from '@/components/common/InlineError'
import { cn } from '@/lib/utils'
import type { TeacherComment } from '../types'
import { CommentCard, type CommentCardProps } from './CommentCard'

export interface CommentListProps {
  comments: TeacherComment[]
  isLoading?: boolean
  error?: string | null
  layout?: 'list' | 'grid'
  commentProps?: Omit<CommentCardProps, 'comment' | 'index'>
  renderComment?: (comment: TeacherComment, index: number) => ReactNode
  emptyState?: ReactNode
  emptyMessage?: string
  skeletonCount?: number
  className?: string
}

/**
 * Renders a collection of comments as a hairline-ruled stream (or a two-column
 * grid), with built-in loading, error and empty states. It owns no data: pass
 * `comments` plus the query flags, and override item rendering with
 * `renderComment` when a screen needs something different.
 *
 * @example
 * <CommentList comments={comments} isLoading={isPending} />
 *
 * @example
 * <CommentList
 *   comments={comments}
 *   layout="grid"
 *   commentProps={{ variant: 'compact', clampLines: 3 }}
 * />
 */
export function CommentList({
  comments,
  isLoading = false,
  error = null,
  layout = 'list',
  commentProps,
  renderComment,
  emptyState,
  emptyMessage = 'No hay comentarios para mostrar.',
  skeletonCount = 3,
  className,
}: CommentListProps) {
  if (isLoading) return <CommentListSkeleton count={skeletonCount} className={className} />

  if (error) return <InlineError message={error} />

  if (comments.length === 0) {
    if (emptyState) return <>{emptyState}</>

    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <MessageSquareDashed className="text-muted-foreground/40 size-6" aria-hidden="true" />

        <p className="text-muted-foreground max-w-xs text-sm text-balance">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid gap-x-8 sm:grid-cols-2 [&>*]:border-b [&>*]:border-dashed'
          : 'divide-border/70 divide-y',
        'border-border/70',
        className,
      )}
    >
      {comments.map((comment, index) => {
        const style = { animationDelay: `${Math.min(index, 8) * 60}ms` }

        return renderComment ? (
          <div key={comment.id} style={style}>
            {renderComment(comment, index)}
          </div>
        ) : (
          <CommentCard
            key={comment.id}
            comment={comment}
            index={index}
            style={style}
            {...commentProps}
          />
        )
      })}
    </div>
  )
}

const SKELETON_WIDTHS = ['w-11/12', 'w-full', 'w-8/12', 'w-10/12', 'w-6/12']

function CommentListSkeleton({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn('divide-border/70 divide-y', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid grid-cols-[1.5rem_1fr] gap-x-4 py-5">
          <div className="bg-muted mx-auto h-1.5 w-1.5 rounded-full" />

          <div className="space-y-2">
            <div className={cn('bg-muted h-3.5 rounded-full', SKELETON_WIDTHS[index % 5])} />
            <div className={cn('bg-muted h-3.5 rounded-full', SKELETON_WIDTHS[(index + 2) % 5])} />
            <div className="bg-muted/70 mt-3 h-2.5 w-40 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
