import { useQuery } from "@tanstack/react-query";

import getAdminDashboard from "../api/getAdminDashboard";

export default function useGetAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getAdminDashboard(),
  });
}
