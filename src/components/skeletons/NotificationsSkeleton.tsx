import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Title and message widths per row, so the list doesn't read as five identical
 * stamps. The last row is "read" — no mark-as-read button, like the real one.
 */
const ROWS = [
  { title: 'w-64', message: 'w-11/12', unread: true },
  { title: 'w-48', message: 'w-8/12', unread: true },
  { title: 'w-72', message: 'w-10/12', unread: false },
  { title: 'w-56', message: 'w-9/12', unread: true },
  { title: 'w-52', message: 'w-7/12', unread: false },
]

/**
 * Loading placeholder for the notifications page list. Mirrors the real
 * layout — the bordered card, its hairline-separated rows (type icon,
 * title, message, date, mark-as-read action) and the pager below it — so
 * nothing shifts when the notifications land.
 *
 * @example
 * if (isPending) return <NotificationsSkeleton />
 */
function NotificationsSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <span className="sr-only">Cargando las notificaciones…</span>

      <div className="bg-background border-border/70 overflow-hidden rounded-lg border">
        {ROWS.map((row, index) => (
          <div key={index} className="border-border flex gap-3 border-b p-4">
            <Skeleton className="mt-0.5 size-4 shrink-0 rounded-sm" />

            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className={cn('h-3.5', row.title)} />
              <Skeleton className={cn('h-3', row.message)} />
              <Skeleton className="h-3 w-28" />
            </div>

            {row.unread && <Skeleton className="size-6 shrink-0 rounded-md" />}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-8 rounded-md" />
      </div>
    </div>
  )
}

export default NotificationsSkeleton
