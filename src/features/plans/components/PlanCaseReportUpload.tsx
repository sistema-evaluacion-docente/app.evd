import { FileDropzone } from '@/components/common/FileDropzone'
import { useFileUpload } from '@/hooks/useFileUpload'

interface PlanCaseReportUploadProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

/**
 * Attaches the scanned Formato 1 — the case an academic programme referred to
 * the department head — while the plan is being drawn up.
 *
 * The file is only held here: the API files a signed copy against a plan that
 * already exists, so it is sent right after the plan is created (see
 * `PlanFormPage`). Validation runs on the way in rather than on submit, so a
 * wrong file is caught while the director is still looking at the picker.
 *
 * @example
 * <PlanCaseReportUpload file={caseReport} onFileChange={setCaseReport} />
 */
export function PlanCaseReportUpload({ file, onFileChange }: PlanCaseReportUploadProps) {
  // The hook is the one that decides what counts as a file; the parent only
  // keeps a copy to submit, so it is told about the valid ones and cleared for
  // everything else.
  const { error, handleFile } = useFileUpload({ onValidFile: onFileChange })

  return (
    <section className="border-border bg-card space-y-4 rounded-md border p-6">
      <div>
        <h2 className="font-semibold">Formato 1 · Caso reportado</h2>
        <p className="text-muted-foreground text-sm">
          Opcional. Adjunta el PDF del caso que el programa académico remitió a la dirección de
          departamento. Sólo lo ve la dirección: no se le muestra al docente.
        </p>
      </div>

      <FileDropzone
        file={file}
        onFileChange={(candidate) => {
          // Dropped first, so a removal — or a rejected candidate, which never
          // reaches `onValidFile` — doesn't leave the previous file staged.
          onFileChange(null)
          handleFile(candidate)
        }}
        error={error}
        label="Formato 1 firmado"
        title="Selecciona el PDF del caso reportado"
      />
    </section>
  )
}
