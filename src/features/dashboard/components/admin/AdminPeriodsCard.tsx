import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import { Link } from "wouter";

import type { AdminPeriodItem } from "../../api/getAdminDashboard";

interface AdminPeriodsCardProps {
  periods: AdminPeriodItem[];
  isLoading: boolean;
}

function AdminPeriodsCard({ periods, isLoading }: AdminPeriodsCardProps) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-muted-foreground" />
          <CardTitle>Periodos Academicos</CardTitle>
        </div>

        <Link
          href="/periods"
          className="text-xs text-muted-foreground underline"
        >
          Gestionar
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>

                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : periods.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No hay periodos academicos registrados
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{period.name}</p>

                    {period.active && (
                      <span className="inline-flex h-5 w-fit shrink-0 items-center rounded-4xl bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Activo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminPeriodsCard;
