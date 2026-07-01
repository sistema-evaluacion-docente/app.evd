import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

import useGetCommentCount from "../hooks/useGetCommentCount";
import KpiCard from "./KpiCard";
import { Link } from "wouter";

function CardComments() {
  const { data, isLoading } = useGetCommentCount();

  const commentCount = data?.data?.current_count ?? 0;
  const previousCommentCount = data?.data?.previous_count ?? 0;

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <Link to={`/evaluaciones/`} className="transition-opacity hover:opacity-80">
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
