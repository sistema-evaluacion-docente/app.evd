import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { variant: "success" | "warning" | "danger"; label: string }
  > = {
    COMPLETED: { variant: "success", label: "Completado" },
    PROCESSING: { variant: "warning", label: "Procesando" },
    FAILED: { variant: "danger", label: "Error" },
  };

  const cfg = map[status] ?? { variant: "warning" as const, label: status };

  return (
    <Badge variant="outline" className="bg-background">
      {cfg.label}
    </Badge>
  );
}
