import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";
import { Link } from "wouter";

import type { AdminAuditItem } from "../../api/getAdminDashboard";

interface AdminRecentLogsProps {
  audits: AdminAuditItem[];
  isLoading: boolean;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function getOperationColor(operation: string | null): string {
  switch (operation?.toUpperCase()) {
    case "CREATE":
      return "bg-emerald-100 text-emerald-700";
    case "UPDATE":
      return "bg-amber-100 text-amber-700";
    case "DELETE":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-ink-100 text-ink-600";
  }
}

function AdminRecentLogs({ audits, isLoading }: AdminRecentLogsProps) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText size={16} className="text-ink-500" />
          <CardTitle>Actividad Reciente</CardTitle>
        </div>

        <Link
          href="/logs"
          className="text-xs text-muted-foreground underline"
        >
          Ver todos
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />

                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>

                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : audits.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No hay registros de actividad
          </div>
        ) : (
          <div className="space-y-4">
            {audits.map((audit) => (
              <div
                key={audit.id}
                className="flex items-start gap-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold ${getOperationColor(audit.operation)}`}
                >
                  {audit.operation?.charAt(0) ?? "?"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {audit.description ?? audit.element ?? "—"}
                    </p>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {audit.user_name && (
                      <span className="truncate">{audit.user_name}</span>
                    )}

                    {audit.table_name && (
                      <>
                        <span className="text-ink-300">·</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                          {audit.table_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(audit.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminRecentLogs;
