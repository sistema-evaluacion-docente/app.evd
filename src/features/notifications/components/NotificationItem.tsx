import { AlertTriangle, CheckCheck, CheckCircle, Info, XCircle } from 'lucide-react'

import { TransitionLink } from '@/components/common/TransitionLink'
import { Button } from '@/components/ui/button'
import formatDate from '@/lib/formatDate'
import type { Notification, NotificationType } from '../types/Notification'

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'info':
      return <Info className="size-4 text-blue-500" />
    case 'warning':
      return <AlertTriangle className="size-4 text-amber-500" />
    case 'error':
      return <XCircle className="size-4 text-red-500" />
    case 'success':
      return <CheckCircle className="size-4 text-green-500" />
    default:
      return <Info className="text-muted-foreground size-4" />
  }
}

export interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: number) => void
  /** Called after following the notification's link, e.g. to close a popover. */
  onNavigate?: () => void
}

/**
 * Single notification row: type icon, title/message/date, and a "mark as
 * read" action. Wraps itself in a link when the notification carries one.
 * Shared by the header bell popover and the full notifications page.
 *
 * @example
 * <NotificationItem notification={notification} onMarkAsRead={markAsRead} />
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onNavigate,
}: NotificationItemProps) {
  const body = (
    <>
      <div className="flex-shrink-0 pt-0.5">{getNotificationIcon(notification.type)}</div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-tight font-medium">{notification.title}</p>
        <p className="text-muted-foreground line-clamp-2 text-xs">{notification.message}</p>
        <p className="text-muted-foreground text-xs">{formatDate(notification.created_at)}</p>
      </div>
    </>
  )

  return (
    <div
      className={`flex gap-3 rounded border-b p-3 transition-colors ${
        notification.read
          ? 'bg-muted/50 border-transparent opacity-70'
          : 'bg-background border-border'
      }`}
    >
      {notification.link ? (
        <TransitionLink
          href={notification.link}
          className="flex min-w-0 flex-1 gap-3"
          onClick={onNavigate}
        >
          {body}
        </TransitionLink>
      ) : (
        <div className="flex min-w-0 flex-1 gap-3">{body}</div>
      )}

      {!notification.read && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onMarkAsRead(notification.id)}
          className="flex-shrink-0"
          aria-label="Marcar como leída"
        >
          <CheckCheck className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
