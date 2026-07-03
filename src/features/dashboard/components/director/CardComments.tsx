import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { Link } from "wouter";

import useGetCommentCount from "../../hooks/useGetCommentCount";
import KpiCard from "../KpiCard";

function CardComments() {
  const { data, isLoading, isFetched } = useGetCommentCount();

  const commentCount = data?.data?.current_count ?? 0;
  const previousCommentCount = data?.data?.previous_count ?? 0;

  if (isLoading || !isFetched) {
    return (
      <Card>
        <CardContent className="relative">
          <Skeleton className="h-4 w-32 mb-6" />

          <Skeleton className="absolute right-6 top-6 h-8 w-8 opacity-30" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      to={`/evaluaciones/`}
      className="transition-opacity hover:opacity-80 animate-fade-in"
    >
      <KpiCard
        value={commentCount}
        trend={commentCount - previousCommentCount}
        trendColor="text-brand-600"
        progress={100}
        icon={<MessageSquare size={30} />}
        label="Comentarios Riesgo"
        progressColor="bg-brand-600"
      />
    </Link>
  );
}

export default CardComments;
