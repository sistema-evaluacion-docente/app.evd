import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import React from 'react'

import { useGetAudit } from '@/features/audits'
import { getOperation } from '@/features/audits/lib/LogOperations'
import formatDate from '@/lib/formatDate'

interface AuditDetailDrawerProps {
  open: boolean
  auditId: number | null
  onOpenChange: (open: boolean) => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 flex items-baseline justify-between gap-4 rounded-lg px-4 py-3">
      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-right text-sm">{value}</span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-3 px-4 pb-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-muted/50 h-11 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

function DetailContent({
  audit,
}: {
  audit: NonNullable<ReturnType<typeof useGetAudit>['data']>['data']
}) {
  const action = getOperation(audit.operation) ?? {
    label: audit.operation,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="bg-muted/50 flex items-center gap-3 rounded-lg px-4 py-3">
        <Avatar>
          <AvatarFallback>{audit.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
          <AvatarImage src={audit.user.avatar_url} />
        </Avatar>

        <div className="leading-tight">
          <div className="text-foreground text-sm font-medium">{audit.user.name}</div>

          <div className="text-muted-foreground text-xs">{audit.user.email}</div>
        </div>
      </div>

      <DetailRow label="Registro N°" value={String(audit.id).padStart(4, '0')} />

      <DetailRow label="Tabla afectada" value={audit.table_name} />

      {/* <Popover>
        <PopoverTrigger className="bg-muted/50 hover:bg-muted/70 flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Elemento
          </span>

          <span className="text-foreground flex items-center gap-1.5 text-sm">
            <Eye className="text-muted-foreground size-3.5" />
          </span>
        </PopoverTrigger>

        <PopoverContent side="left" align="start" className="w-80">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Datos del elemento
            </p>

            {(() => {
              try {
                const data = audit.element_data

                return Object.entries(data).map(([key, value]) => (
                  <div className="bg-muted/50 flex items-baseline justify-between gap-2 rounded-md px-3 py-1.5">
                    <span className="text-muted-foreground text-xs font-medium">{key}</span>

                    <span className="text-foreground text-right text-xs">{String(value)}</span>
                  </div>
                ))
              } catch {
                return <p className="text-muted-foreground text-xs">{audit.element_data}</p>
              }
            })()}
          </div>
        </PopoverContent>
      </Popover> */}

      <div className="bg-muted/50 flex items-baseline justify-between gap-4 rounded-lg px-4 py-3">
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Operación
        </span>

        <span
          className={cn(
            'inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold tracking-wide uppercase',
            action.bg,
            action.text,
          )}
        >
          {action.label}
        </span>
      </div>

      <div className="bg-muted/50 flex flex-col gap-4 rounded-lg px-4 py-3">
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Descripción
        </span>

        <div>
          {audit.description?.split(';')?.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
      <DetailRow label="Fecha de creación" value={formatDate(audit.created_at)} />

      <DetailRow label="Última actualización" value={formatDate(audit.updated_at)} />
    </div>
  )
}

/**
 * AuditDetailDrawer component displays detailed information about a specific audit log entry.
 *
 * @param {boolean} open - Indicates whether the drawer is open or closed.
 * @param {number | null} auditId - The ID of the audit log entry to display details for.
 * @param {(open: boolean) => void} onOpenChange - Callback function to handle changes in the drawer's open state.
 */
export function AuditDetailDrawer({ open, auditId, onOpenChange }: AuditDetailDrawerProps) {
  const { data, isLoading } = useGetAudit(open ? auditId : null)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader className="relative">
          <DrawerClose className="absolute top-4 right-4">
            <Button type="button" variant="ghost" size="icon">
              <X className="size-4" />
            </Button>
          </DrawerClose>

          <DrawerTitle>Detalle del Log</DrawerTitle>

          <DrawerDescription>Información completa de la actividad registrada.</DrawerDescription>
        </DrawerHeader>

        {isLoading && <DetailSkeleton />}

        {data && <DetailContent audit={data.data} />}

        <DrawerFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
