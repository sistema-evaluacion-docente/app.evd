import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { Link } from "wouter";

import type { AdminDashboardCounts } from "../../api/getAdminDashboard";

interface AdminUsersSummaryProps {
  counts: AdminDashboardCounts;
  isLoading: boolean;
  isFetched: boolean;
}

function AdminUsersSummary({
  counts,
  isLoading,
  isFetched,
}: AdminUsersSummaryProps) {
  if (isLoading || !isFetched) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeUsers = counts.active_users;
  const inactiveUsers = counts.users - counts.active_users;
  const activePercent =
    counts.users > 0 ? Math.round((activeUsers / counts.users) * 100) : 0;

  return (
    <Card className="pt-0 animate-fade-in">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-ink-500" />
          <CardTitle>Resumen de Usuarios</CardTitle>
        </div>

        <Link href="/users" className="text-xs text-muted-foreground underline">
          Ver todos
        </Link>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>

            <span className="text-2xl font-bold tabular-nums">
              {counts.users}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">Activos</span>
              </div>

              <span className="text-sm font-semibold tabular-nums text-emerald-600">
                {activeUsers}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="text-sm text-muted-foreground">Inactivos</span>
              </div>

              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {inactiveUsers}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tasa de activacion</span>
              <span>{activePercent}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Docentes registrados
              </span>

              <span className="font-semibold tabular-nums">
                {counts.teachers}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminUsersSummary;
