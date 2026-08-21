import { Bell, CheckCheck, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { PageTitle } from '@/components/common/PageTitle'
import NotificationsSkeleton from '@/components/skeletons/NotificationsSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetMyNotifications } from '../api'
import { NotificationItem } from '../components'
import { useNotifications } from '../hooks'
import type { NotificationType } from '../types/Notification'

const filterConfig: FilterConfig[] = [
  {
    type: 'select',
    name: 'type',
    label: 'Tipo',
    options: [
      { label: 'Información', value: 'info' },
      { label: 'Advertencia', value: 'warning' },
      { label: 'Error', value: 'error' },
      { label: 'Éxito', value: 'success' },
    ],
    clearable: true,
  },
  {
    type: 'select',
    name: 'read',
    label: 'Estado',
    options: [
      { label: 'No leídas', value: 'false' },
      { label: 'Leídas', value: 'true' },
    ],
    clearable: true,
  },
]

/**
 * Full page listing every notification of the authenticated user, with
 * server-side pagination, search, and filters by type and read status.
 */
export default function NotificationsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [page, setPage] = useState(1)

  const { filters, setFilters } = useTableFilters('notifications', {
    type: undefined as NotificationType | undefined,
    read: undefined as string | undefined,
  })

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const { unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const { data, isPending, isFetching, error, refetch } = useGetMyNotifications({
    page,
    limit: 10,
    filters: {
      type: filters.type as NotificationType | undefined,
      read: filters.read === undefined ? undefined : filters.read === 'true',
      search: debouncedSearch || undefined,
    },
  })

  const notifications = data?.data ?? []
  const pages = data?.pagination?.pages ?? 1

  const handleMarkAsRead = async (id: number) => {
    await markAsRead([id])
    refetch()
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    refetch()
  }

  return (
    <>
      <PageTitle
        {...(unreadCount > 0
          ? {
              onAction: handleMarkAllAsRead,
              actionLabel: 'Marcar todas como leídas',
              actionIcon: CheckCheck,
            }
          : {})}
      >
        Notificaciones
      </PageTitle>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />

            <Input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                resetPage()
              }}
              placeholder="Buscar en las notificaciones..."
              aria-label="Buscar en las notificaciones"
              className="bg-background h-9 w-64 pl-9 shadow-none"
            />
          </div>

          <DataTableFilters
            filters={filterConfig}
            values={filters}
            onChange={(values) => {
              setFilters(values)
              resetPage()
            }}
          />
        </div>

        {isPending ? (
          <NotificationsSkeleton />
        ) : (
          <div className="bg-background border-border/70 overflow-hidden rounded-lg border">
            {error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-destructive text-sm">{error.message}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="text-muted-foreground/40 size-10" aria-hidden="true" />
                <p className="text-muted-foreground mt-4 text-sm">
                  No tienes notificaciones que coincidan con los filtros aplicados.
                </p>
              </div>
            ) : (
              <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!isPending && !error && notifications.length > 0 && (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>

            <span
              aria-live="polite"
              className="text-muted-foreground min-w-20 text-center text-sm tabular-nums"
            >
              Página {page} de {pages}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              aria-label="Página siguiente"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
