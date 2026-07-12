import { useQuery } from "@tanstack/react-query";
import { getQuestions } from "../api/evaluationService";

export default function useGetQuestions() {
  return useQuery({
    queryKey: ["evaluation-questions"],
    queryFn: getQuestions,
    staleTime: 60 * 60 * 1000,
  });
}
