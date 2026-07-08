import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  UploadDropzone,
  UploadFooter,
  UploadStats,
  UploadStatusCard,
  useUploadEvaluation,
} from "@/features/evaluations";
import { PageHeader } from "@/shared/ui";

function UploadEvaluationsContent() {
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const { status, progress, fileName, fileSize, error, stats, upload, reset } =
    useUploadEvaluation();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    upload(file);
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  const handleReset = useCallback(() => {
    reset();
    setDropzoneKey((k) => k + 1);
  }, [reset]);

  const busy = status === "uploading" || status === "processing";
  const ready = status === "success";

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
        ready={ready}
        teachers={stats.teachers}
        comments={stats.comments}
      />

      <UploadFooter status={status} ready={ready} />
    </>
  );
}

export default UploadEvaluationsContent;
