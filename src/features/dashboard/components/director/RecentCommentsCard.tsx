import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { Link } from "wouter";

import useGetCommentsByPeriod from "@/features/comments/hooks/useGetCommentsByPeriod";
import type { CommentPeriod } from "@/features/comments/types/CommentPeriod";
import type { EvaluationRecord } from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods/store/periodsStore";

type Props = {
  evaluation: EvaluationRecord | null;
  initialLoading?: boolean;
};

function RecentCommentsCard({ evaluation, initialLoading }: Props) {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  const { data, isLoading } = useGetCommentsByPeriod({
    periodId: Number(selectedPeriod?.id),
    page: 1,
    limit: 5,
    search: "",
    riskLevel: 2,
  });

  if (!selectedPeriod?.id) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Seleccione un período académico para ver los comentarios.
        </CardContent>
      </Card>
    );
  }

  const comments = data?.data ?? [];

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={18} />
          Comentarios
        </CardTitle>

        <Link
          href={`/evaluations/${evaluation?.id}`}
          className="text-xs text-muted-foreground underline"
        >
          Ver todos
        </Link>
      </CardHeader>

      <CardContent>
        {initialLoading || isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            No se encontraron comentarios para este período.
          </div>
        ) : (
          <ul className="space-y-3 list-disc list-inside">
            {comments.map((comment: CommentPeriod) => (
              <li key={comment.id} className="text-muted-foreground text-sm">
                {comment.original_text ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentCommentsCard;
