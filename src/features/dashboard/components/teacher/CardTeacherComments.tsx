import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { Link } from "wouter";

import useGetTeacherCommentCount from "../../hooks/useGetTeacherCommentCount";
import KpiCard from "../KpiCard";

function CardTeacherComments() {
  const { data, isLoading, isFetched } = useGetTeacherCommentCount();

  const { current_count, previous_count } = data?.data ?? {};

  const currentCount = Number(current_count ?? 0);
  const prevCount = Number(previous_count ?? 0);

  if (isLoading || !isFetched) {
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

  return (
    <Link
      to={`/matrix`}
      className="transition-opacity hover:opacity-80 animate-fade-in"
    >
      <KpiCard
        value={currentCount}
        trend={currentCount - prevCount}
        trendColor="text-brand-600"
        icon={<MessageSquare size={30} />}
        label="Mis Comentarios"
      />
    </Link>
  );
}

export default CardTeacherComments;
