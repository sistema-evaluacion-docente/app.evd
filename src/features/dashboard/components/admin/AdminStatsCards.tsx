import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CalendarDays, GraduationCap, Users } from "lucide-react";

import type { AdminDashboardCounts } from "../../api/getAdminDashboard";
import KpiCard from "../KpiCard";
import { Link } from "wouter";

interface AdminStatsCardsProps {
  counts: AdminDashboardCounts;
  isLoading: boolean;
  isFetched: boolean;
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="relative">
        <Skeleton className="h-4 w-40 mb-6" />
        <Skeleton className="absolute right-6 top-6 h-8 w-8 opacity-30" />

        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function AdminStatsCards({
  counts,
  isLoading,
  isFetched,
}: AdminStatsCardsProps) {
  if (isLoading || !isFetched) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      <Link
        to={`/faculties`}
        className="transition-opacity hover:opacity-80 animate-fade-in"
      >
        <KpiCard
          label="Facultades"
          value={counts.faculties}
          icon={<Building2 size={30} />}
          trend={0}
        />
      </Link>

      <Link
        to={`/departments`}
        className="transition-opacity hover:opacity-80 animate-fade-in"
      >
        <KpiCard
          label="Departamentos"
          value={counts.departments}
          icon={<GraduationCap size={30} />}
          trend={0}
        />
      </Link>

      <Link
        to={`/users`}
        className="transition-opacity hover:opacity-80 animate-fade-in"
      >
        <KpiCard
          label="Usuarios"
          value={counts.users}
          icon={<Users size={30} />}
          trend={0}
        />
      </Link>

      <Link
        to={`/periods`}
        className="transition-opacity hover:opacity-80 animate-fade-in"
      >
        <KpiCard
          label="Periodos"
          value={counts.academic_periods}
          icon={<CalendarDays size={30} />}
          trend={0}
        />
      </Link>
    </div>
  );
}

export default AdminStatsCards;
