import { useCallback, useEffect, useRef, useState } from "react";

import {
  getComments,
  getEvaluation,
  uploadEvaluation,
} from "../api/evaluationService";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

const MAX_SIZE = 50 * 1024 * 1024;
const POLL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // 60 s máximo de espera

interface UploadStats {
  teachers: number;
  comments: number;
}

export function useUploadEvaluation() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UploadStats>({ teachers: 0, comments: 0 });

  const pollId = useRef<number>(0);
  const tickId = useRef<number>(0);
  const progressVal = useRef(0);
  const pollAttempts = useRef(0);

  const clearTimers = () => {
    window.clearInterval(pollId.current);
    window.clearInterval(tickId.current);
  };

  useEffect(() => () => clearTimers(), []);

  const startTick = (from: number, to: number, stepMs: number) => {
    window.clearInterval(tickId.current);
    progressVal.current = from;
    tickId.current = window.setInterval(() => {
      progressVal.current = Math.min(progressVal.current + 1, to);
      setProgress(progressVal.current);
      if (progressVal.current >= to) window.clearInterval(tickId.current);
    }, stepMs);
  };

  const upload = useCallback(async (file: File) => {
    clearTimers();
    setFileName(file.name);
    setError("");
    progressVal.current = 0;
    setProgress(0);

    if (
      file.type &&
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Solo se aceptan archivos en formato PDF Institucional.");
      setStatus("error");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("El archivo excede el tamaño máximo de 50MB.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    // Animate 0 → 45% while the upload request is in flight
    startTick(0, 45, 120);

    try {
      const uploadResult = await uploadEvaluation(file);
      const evaluationId: number = uploadResult.data.id;

      // Upload accepted (202), switch to polling phase
      window.clearInterval(tickId.current);
      setStatus("processing");
      // Animate 45 → 85% slowly while we wait for COMPLETED
      startTick(45, 85, 500);
      pollAttempts.current = 0;

      pollId.current = window.setInterval(async () => {
        pollAttempts.current += 1;

        if (pollAttempts.current > MAX_POLL_ATTEMPTS) {
          clearTimers();
          setProgress(0);
          setError("El procesamiento tardó demasiado. Intente de nuevo.");
          setStatus("error");
          return;
        }

        try {
          const pollResult = await getEvaluation(evaluationId);
          const evaluationStatus = pollResult.data.status;

          if (evaluationStatus === "COMPLETED") {
            clearTimers();
            const commentsResult = await getComments(evaluationId);
            setStats({
              teachers: pollResult.data.count ?? 0,
              comments: commentsResult.data.length,
            });
            setProgress(100);
            setStatus("success");
          } else if (evaluationStatus === "FAILED") {
            clearTimers();
            setProgress(0);
            setError("El servidor no pudo procesar el PDF. Intente de nuevo.");
            setStatus("error");
          }
        } catch {
          clearTimers();
          setProgress(0);
          setError("Error al verificar el estado del procesamiento.");
          setStatus("error");
        }
      }, POLL_MS);
    } catch (err) {
      clearTimers();
      setProgress(0);
      setError(
        err instanceof Error ? err.message : "Error al subir el archivo.",
      );
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    progressVal.current = 0;
    setStatus("idle");
    setProgress(0);
    setFileName("");
    setError("");
    setStats({ teachers: 0, comments: 0 });
  }, []);

  const loadSample = useCallback(() => {
    clearTimers();
    setFileName("evaluaciones_finales_2023_Q2.pdf");
    setProgress(100);
    setStats({ teachers: 142, comments: 3892 });
    setStatus("success");
  }, []);

  return {
    status,
    progress,
    fileName,
    error,
    stats,
    upload,
    reset,
    loadSample,
  };
}
