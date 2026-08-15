import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Bell, CheckCheck, CheckCircle, Info, XCircle } from 'lucide-react'
import { useState } from 'react'

import { TransitionLink } from '@/components/common/TransitionLink'
import formatDate from '@/lib/formatDate'
import { useNotifications } from '../hooks/useNotifications'
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

function NotificationItem({
  notification,
  onMarkAsRead,
  onNavigate,
}: {
  notification: Notification
  onMarkAsRead: (id: number) => void
  /** Called after following the notification's link, e.g. to close the popover. */
  onNavigate: () => void
}) {
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

/**
 * Bell button that opens a popover with the current user's notifications.
 *
 * @example
 * <NotificationsBell />
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()

  const handleMarkAsRead = (id: number) => {
    markAsRead([id])
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 size-5 p-0 text-[10px] font-bold"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />

      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex flex-col overflow-hidden rounded-md">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="xs" onClick={handleMarkAllAsRead} className="text-xs">
                Marcar todas como leídas
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="text-muted-foreground/50 size-12" />
                <p className="text-muted-foreground mt-4 text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
