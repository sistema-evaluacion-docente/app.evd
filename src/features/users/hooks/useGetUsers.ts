import { useQuery } from "@tanstack/react-query";

import getAllUsers from "../api/getAllUsers";

/**
 * Hook to fetch all users from the API.
 *
 * @param page - The page number to fetch.
 * @returns The query result.
 */
export default function useGetUsers(page = 1) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () => getAllUsers(page),
  });
}
