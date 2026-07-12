import { useQuery } from "@tanstack/react-query";
import getAudit from "../api/getAudit";

export default function useGetAudit(id: number | null) {
  return useQuery({
    queryKey: ["audits", id],
    queryFn: () => getAudit(id!),
    enabled: id !== null,
  });
}
