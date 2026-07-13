import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { TABLE_NAMES } from "@/features/audits";
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


function AdminRecentLogs({ audits, isLoading }: AdminRecentLogsProps) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText size={16} className="text-ink-500" />
          <CardTitle>Actividad Reciente</CardTitle>
        </div>

        <Link href="/logs" className="text-xs text-muted-foreground underline">
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
                className="flex items-start gap-3 transition-colors"
              >
                <Avatar>
                  <AvatarFallback>
                    {audit.user_name?.charAt(0)}
                  </AvatarFallback>

                  <AvatarImage src={audit?.user_avatar ?? ""} alt={audit?.user_name ?? "Username"} />
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {audit.description ?? audit.element ?? "—"}
                    </p>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {audit.user_name && (
                      <span className="truncate">{audit.user_name}</span>
                    )}

                    {audit.table_name && (
                      <>
                        <span className="text-muted-foreground">·</span>

                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {TABLE_NAMES?.find(
                            (t) => t.value === audit.table_name,
                          )?.label ?? audit.table_name}
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
