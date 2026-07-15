import { useCallback, useEffect, useRef, useState } from "react";

import type { AiStatus } from "../api/evaluationService";
import { analyzeEvaluation, getEvaluation } from "../api/evaluationService";

const POLL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // 2 minutos máximo

export default function useAnalyzeEvaluation() {
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [error, setError] = useState("");
  const pollId = useRef<number>(0);
  const pollAttempts = useRef(0);

  useEffect(() => () => window.clearInterval(pollId.current), []);

  const analyze = useCallback(
    async (evaluationId: number, currentAiStatus: AiStatus | null) => {
      setAiStatus(currentAiStatus);
      setError("");
      setAiStatus("ANALYZING");

      try {
        await analyzeEvaluation(evaluationId);
        pollAttempts.current = 0;

        pollId.current = window.setInterval(async () => {
          pollAttempts.current += 1;

          if (pollAttempts.current > MAX_POLL_ATTEMPTS) {
            window.clearInterval(pollId.current);
            setError("El análisis tardó demasiado. Intente de nuevo.");
            setAiStatus("FAILED");
            return;
          }

          try {
            const result = await getEvaluation(evaluationId);
            const status = result.data.ai_status;
            if (status) setAiStatus(status);

            if (status === "ANALYZED" || status === "FAILED") {
              window.clearInterval(pollId.current);
              if (status === "FAILED") {
                setError("El análisis de IA falló. Intente de nuevo.");
              }
            }
          } catch {
            window.clearInterval(pollId.current);
            setError("Error al verificar el estado del análisis.");
            setAiStatus("FAILED");
          }
        }, POLL_MS);
      } catch {
        setError("Error al iniciar el análisis. Intente de nuevo.");
        setAiStatus("FAILED");
      }
    },
    [],
  );

  const reset = useCallback(() => {
    window.clearInterval(pollId.current);
    setAiStatus(null);
    setError("");
  }, []);

  return { analyze, aiStatus, setAiStatus, error, reset };
}
