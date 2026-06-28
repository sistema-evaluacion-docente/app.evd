import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

import useGetCommentCount from "../hooks/useGetCommentCount";
import KpiCard from "./KpiCard";

function CardComments() {
  const { data, isLoading } = useGetCommentCount();

  const commentCount = data?.data?.current_count ?? 0;
  const previousCommentCount = data?.data?.previous_count ?? 0;

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <KpiCard
      value={commentCount}
      trend={
        previousCommentCount ? `+${commentCount - previousCommentCount}` : "0"
      }
      trendColor="text-brand-600"
      progress={100}
      icon={<MessageSquare size={18} className="text-brand-600" />}
      label="Comentarios"
      progressColor="bg-brand-600"
    />
  );
}

export default CardComments;
