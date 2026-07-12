import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  uploadTeachersExcel,
  type TeacherBulkResult,
} from "../api/teacherService";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_SIZE = 5 * 1024 * 1024;

export function useUploadTeachers() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TeacherBulkResult | null>(null);

  const tickId = useRef<number>(0);
  const progressVal = useRef(0);

  const clearTimers = () => {
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
    setResult(null);
    progressVal.current = 0;
    setProgress(0);

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".xlsx", ".xls", ".csv"].includes(ext)) {
      const errorMsg = "Solo se aceptan archivos en formato Excel (.xlsx, .xls) o CSV (.csv)";
      setError(errorMsg);
      toast.error(errorMsg);
      setStatus("error");
      return;
    }

    if (file.size > MAX_SIZE) {
      const errorMsg = "El archivo excede el tamaño máximo de 5MB.";
      setError(errorMsg);
      toast.error(errorMsg);
      setStatus("error");
      return;
    }

    setStatus("uploading");
    startTick(0, 90, 100);

    try {
      const response = await uploadTeachersExcel(file);
      clearTimers();
      setResult(response.data);
      setProgress(100);
      setStatus("success");
    } catch (err) {
      clearTimers();
      setProgress(0);
      const errorMsg = err instanceof Error ? err.message : "Error al subir el archivo.";
      setError(errorMsg);
      toast.error(errorMsg);
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
    setResult(null);
  }, []);

  return {
    status,
    progress,
    fileName,
    error,
    result,
    upload,
    reset,
  };
}
