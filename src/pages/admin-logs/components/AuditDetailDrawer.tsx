import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetAudit } from "@/features/audits";
import formatDate from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { Eye, X } from "lucide-react";
import React from "react";

const OPERATION_LABELS: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  CREATE: { label: "Crear", bg: "bg-emerald-50", text: "text-emerald-700" },
  UPDATE: { label: "Actualizar", bg: "bg-sky-50", text: "text-sky-700" },
  DELETE: { label: "Eliminar", bg: "bg-brand-50", text: "text-brand-700" },
  LOGIN: { label: "Inicio sesión", bg: "bg-ink-100", text: "text-ink-700" },
  LOGOUT: { label: "Cierre sesión", bg: "bg-ink-100", text: "text-ink-700" },
  IMPORT: { label: "Importar", bg: "bg-violet-50", text: "text-violet-700" },
  EXPORT: { label: "Exportar", bg: "bg-amber-50", text: "text-amber-700" },
};

interface AuditDetailDrawerProps {
  open: boolean;
  auditId: number | null;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3 px-4 pb-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}

function DetailContent({
  audit,
}: {
  audit: NonNullable<ReturnType<typeof useGetAudit>["data"]>["data"];
}) {
  const action = OPERATION_LABELS[audit.operation] ?? {
    label: audit.operation,
    bg: "bg-muted",
    text: "text-muted-foreground",
  };

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
        <Avatar>
          <AvatarFallback>
            {audit.user_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
          <AvatarImage src={audit.user_avatar} />
        </Avatar>

        <div className="leading-tight">
          <div className="text-sm font-medium text-foreground">
            {audit.user_name}
          </div>

          <div className="text-xs text-muted-foreground">
            ID: {audit.user_id}
          </div>
        </div>
      </div>

      <DetailRow
        label="Registro N°"
        value={String(audit.id).padStart(4, "0")}
      />

      <div className="flex items-baseline justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Usuario
        </span>

        <div className="flex items-end flex-col-reverse gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Avatar>
                <AvatarFallback>
                  {audit.user_name?.charAt(0).toUpperCase()}
                </AvatarFallback>

                <AvatarImage src={audit.user_avatar} alt={audit.user_name} />
              </Avatar>
            </TooltipTrigger>

            <TooltipContent>
              <p>{audit.user_name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <DetailRow label="Tabla afectada" value={audit.table_name} />

      <Popover>
        <PopoverTrigger className="flex w-full items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3 hover:bg-muted/70 cursor-pointer">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Elemento
          </span>

          <span className="flex items-center gap-1.5 text-sm text-foreground">
            <Eye className="size-3.5 text-muted-foreground" />
          </span>
        </PopoverTrigger>

        <PopoverContent side="left" align="start" className="w-80">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Datos del elemento
            </p>

            {(() => {
              try {
                const data = audit.element_data;

                return Object.entries(data).map(([key, value]) => (
                  <div className="flex items-baseline justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {key}
                    </span>

                    <span className="text-right text-xs text-foreground">
                      {String(value)}
                    </span>
                  </div>
                ));
              } catch {
                return (
                  <p className="text-xs text-muted-foreground">
                    {audit.element_data}
                  </p>
                );
              }
            })()}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-baseline justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Operación
        </span>

        <span
          className={cn(
            "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wide",
            action.bg,
            action.text,
          )}
        >
          {action.label}
        </span>
      </div>

      <div className="flex flex-col gap-4 rounded-lg bg-muted/50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Descripción
        </span>

        <div>
          {audit.description?.split(";")?.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
      <DetailRow
        label="Fecha de creación"
        value={formatDate(audit.created_at)}
      />

      <DetailRow
        label="Última actualización"
        value={formatDate(audit.updated_at)}
      />
    </div>
  );
}

export function AuditDetailDrawer({
  open,
  auditId,
  onOpenChange,
}: AuditDetailDrawerProps) {
  const { data, isLoading } = useGetAudit(open ? auditId : null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader className="relative">
          <DrawerClose className="absolute right-4 top-4" asChild>
            <Button type="button" variant="ghost" size="icon">
              <X className="size-4" />
            </Button>
          </DrawerClose>

          <DrawerTitle>Detalle del Log</DrawerTitle>

          <DrawerDescription>
            Información completa de la actividad registrada.
          </DrawerDescription>
        </DrawerHeader>

        {isLoading && <DetailSkeleton />}

        {data && <DetailContent audit={data.data} />}

        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
