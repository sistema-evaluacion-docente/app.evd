import { ArrowRight, ChevronLeft, ChevronRight, Inbox, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import formatDate from '@/lib/formatDate'
import { useGetSettingHistory } from '../api'

interface SettingHistoryDialogProps {
  /** ID of the setting to show history for. Pass null to close the dialog. */
  settingId: number | null
  /** Key of the setting, shown in the dialog title. */
  settingKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog that fetches and displays the paginated change history of a setting,
 * showing old/new values, author, reason and date of each change.
 *
 * @example
 * <SettingHistoryDialog settingId={12} settingKey="max_hours" open onOpenChange={setOpen} />
 */
export function SettingHistoryDialog({
  settingId,
  settingKey,
  open,
  onOpenChange,
}: SettingHistoryDialogProps) {
  const [page, setPage] = useState(1)

  const { data, isPending, isError } = useGetSettingHistory({
    settingId,
    page,
    limit: 5,
  })

  const history = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1
  const total = data?.pagination?.total ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6">Historial de «{settingKey}»</DialogTitle>

          <DialogDescription>
            Cambios registrados sobre esta configuración, del más reciente al más antiguo.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 -mt-2 max-h-[60vh] space-y-3 overflow-y-auto px-6 pt-2">
          {isPending ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="border-border/40 space-y-2 rounded-lg border p-4">
                <div className="flex justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="size-3.5 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : isError ? (
            <div className="text-muted-foreground py-8 text-center">
              <TriangleAlert
                aria-hidden="true"
                className="text-destructive/60 mx-auto mb-3 size-8"
              />

              <p className="text-sm">Error al cargar el historial.</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Inbox aria-hidden="true" className="text-muted-foreground/40 mx-auto mb-3 size-8" />
              <p className="text-sm">No hay cambios registrados para esta configuración.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map((item) => {
                const name = item.changed_by_name || item.changed_by

                return (
                  <li key={item.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {item.changed_at ? formatDate(item.changed_at) : '—'}
                      </span>

                      {name ? (
                        <span className="flex items-center gap-1.5">
                          <Avatar className="border-border/70 size-5 border">
                            <AvatarImage src={item.changed_by_avatar_url ?? undefined} alt={name} />

                            <AvatarFallback>
                              <span className="text-[8px] font-semibold">
                                {name.slice(0, 2).toUpperCase()}
                              </span>
                            </AvatarFallback>
                          </Avatar>

                          <span className="text-muted-foreground text-xs">{name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <code className="bg-muted/60 text-muted-foreground decoration-destructive/50 max-w-[40%] truncate rounded px-1.5 py-0.5 line-through">
                        {item.old_value || '—'}
                      </code>

                      <ArrowRight
                        aria-hidden="true"
                        className="text-muted-foreground size-3.5 shrink-0"
                      />

                      <code className="bg-muted/60 text-foreground max-w-[40%] truncate rounded px-1.5 py-0.5">
                        {item.new_value || '—'}
                      </code>
                    </div>

                    {item.change_reason ? (
                      <p className="text-muted-foreground mt-2 text-xs">{item.change_reason}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {!isPending && !isError && history.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs tabular-nums">
              {total} {total === 1 ? 'cambio' : 'cambios'}
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>

              <span aria-live="polite" className="min-w-16 text-center text-sm tabular-nums">
                Página {page} de {pageCount}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={page >= pageCount}
                aria-label="Página siguiente"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
