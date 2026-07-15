import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  UploadDropzone,
  UploadFooter,
  UploadStats,
  UploadStatusCard,
  useAnalyzeEvaluation,
  useUploadEvaluation,
} from "@/features/evaluations";
import { PageHeader } from "@/shared/ui";

function UploadEvaluationsContent() {
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const {
    status,
    progress,
    fileName,
    fileSize,
    error,
    stats,
    upload,
    reset,
    evaluationId,
    aiStatus: uploadAiStatus,
  } = useUploadEvaluation();

  const {
    analyze,
    aiStatus,
    setAiStatus,
    error: analyzeError,
    reset: resetAnalyze,
  } = useAnalyzeEvaluation();

  // Sync ai_status from upload polling into the analyze hook
  useEffect(() => {
    if (uploadAiStatus !== null) {
      setAiStatus(uploadAiStatus);
    }
  }, [uploadAiStatus, setAiStatus]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    upload(file);
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  const handleReset = useCallback(() => {
    reset();
    resetAnalyze();
    setDropzoneKey((k) => k + 1);
  }, [reset, resetAnalyze]);

  const handleAnalyze = () => {
    if (!evaluationId) return;
    analyze(evaluationId, aiStatus);
  };

  const busy = status === "uploading" || status === "processing";

  return (
    <>
      <PageHeader title="Carga de Evaluaciones Docentes" />

      <UploadDropzone
        key={dropzoneKey}
        busy={busy}
        onFile={handleFile}
        onError={handleError}
      />

      {status !== "idle" && (
        <UploadStatusCard
          status={status}
          progress={progress}
          fileName={fileName}
          fileSize={fileSize}
          error={error}
          onChangeFile={handleReset}
        />
      )}

      <UploadStats
        ready={status === "success"}
        teachers={stats.teachers}
        comments={stats.comments}
      />

      <UploadFooter
        status={status}
        evaluationId={evaluationId}
        aiStatus={aiStatus}
        onAnalyze={handleAnalyze}
        analyzeError={analyzeError}
      />
    </>
  );
}

export default UploadEvaluationsContent;
