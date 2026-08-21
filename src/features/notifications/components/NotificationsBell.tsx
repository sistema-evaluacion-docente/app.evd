import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell } from 'lucide-react'
import { useState } from 'react'

import { TransitionLink } from '@/components/common/TransitionLink'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

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

          <div className="border-t px-4 py-2.5 text-center">
            <TransitionLink
              href="/notificaciones"
              className="text-primary text-xs font-medium hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todas las notificaciones
            </TransitionLink>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
