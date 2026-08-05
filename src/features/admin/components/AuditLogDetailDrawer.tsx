import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useGetAuditLogById } from '../api'
import { getOperation, getOperationLabel, getTableLabel } from '../config'

interface AuditLogDetailDrawerProps {
  /** ID of the audit log to fetch and display. Pass null to close the drawer. */
  auditId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="border-border/40 flex items-start justify-between gap-4 border-b pb-3">
      <dt className="text-muted-foreground shrink-0 text-sm font-medium">{label}</dt>
      <dd className="text-foreground text-right text-sm wrap-break-word">{value}</dd>
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-6 w-3/4 rounded" />
      <div className="bg-muted h-4 w-1/2 rounded" />

      <div className="mt-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between gap-4">
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="bg-muted h-4 w-32 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Drawer that fetches and displays the full details of a single audit log by ID,
 * including the raw `element_data` snapshot pretty-printed as JSON.
 *
 * Replaces the previous AuditLogDetailDialog with a swipeable drawer UI from the
 * bottom on mobile and a side panel on desktop.
 *
 * @example
 * <AuditLogDetailDrawer auditId={123} open onOpenChange={setOpen} />
 */
export function AuditLogDetailDrawer({ auditId, open, onOpenChange }: AuditLogDetailDrawerProps) {
  const { data, isPending, isError } = useGetAuditLogById(auditId)
  const log = data?.data

  const hasElementData = log?.element_data != null && Object.keys(log.element_data).length > 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right" showSwipeHandle>
      <DrawerContent className="h-full w-full sm:mr-0 sm:ml-auto sm:max-w-xl sm:rounded-l-xl sm:rounded-r-none md:max-w-lg">
        <DrawerHeader className="relative">
          <DrawerClose>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 size-8 rounded-full"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </Button>
          </DrawerClose>

          <DrawerTitle className="pr-8 text-left">
            {isPending ? 'Cargando...' : `Registro de auditoría #${log?.id ?? '—'}`}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isPending ? (
            <DrawerSkeleton />
          ) : isError ? (
            <div className="text-muted-foreground py-8 text-center">
              <p>Error al cargar el registro.</p>
            </div>
          ) : log ? (
            <>
              <dl className="space-y-3">
                <DetailRow label="Usuario" value={log.user?.name ?? 'Sistema'} />
                <DetailRow label="Email" value={log.user?.email ?? '—'} />
                <DetailRow label="Entidad" value={getTableLabel(log.table_name)} />

                <div className="border-border/40 flex items-start justify-between gap-4 border-b pb-3">
                  <dt className="text-muted-foreground shrink-0 text-sm font-medium">Operación</dt>
                  <dd className="text-right">
                    {(() => {
                      const config = log.operation ? getOperation(log.operation) : null
                      return (
                        <Badge
                          className={cn(
                            'font-medium',
                            config?.bg ?? 'bg-muted',
                            config?.text ?? 'text-muted-foreground',
                          )}
                        >
                          {getOperationLabel(log.operation)}
                        </Badge>
                      )
                    })()}
                  </dd>
                </div>

                <DetailRow label="Elemento" value={log.element ?? '—'} />
                <DetailRow label="Descripción" value={log.description ?? '—'} />

                <DetailRow
                  label="Fecha de creación"
                  value={log.created_at ? formatDate(log.created_at) : '—'}
                />
                {log.updated_at && log.updated_at !== log.created_at && (
                  <DetailRow label="Última actualización" value={formatDate(log.updated_at)} />
                )}
              </dl>

              {hasElementData && (
                <div className="mt-6">
                  <h4 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                    Datos del registro
                  </h4>
                  <pre className="bg-muted/50 text-muted-foreground border-border/40 overflow-auto rounded-lg border p-4 text-xs leading-relaxed">
                    {JSON.stringify(log.element_data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
