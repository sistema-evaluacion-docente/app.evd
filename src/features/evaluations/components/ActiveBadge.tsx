import { Badge } from "@/components/ui/badge";

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge>{active ? "Activo" : "Inactivo"}</Badge>;
}
