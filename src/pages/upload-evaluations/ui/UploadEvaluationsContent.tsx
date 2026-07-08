import { useCallback, useState } from "react";

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

  const handleReset = useCallback(() => {
    reset();
    setDropzoneKey((k) => k + 1);
  }, [reset]);

  const busy = status === "uploading" || status === "processing";
  const ready = status === "success";

  return (
    <>
      <PageHeader title="Carga de Evaluaciones Docentes" />

      <UploadDropzone key={dropzoneKey} busy={busy} onFile={handleFile} />

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
