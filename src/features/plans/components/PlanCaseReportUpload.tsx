import { Download, HelpCircle } from 'lucide-react'

import { FileDropzone } from '@/components/common/FileDropzone'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFileUpload } from '@/hooks/useFileUpload'

interface PlanCaseReportUploadProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

/** The blank official form, served from `public/` like the sample CSV of docentes. */
const TEMPLATE_URL = '/formato-1.pdf'

/**
 * Attaches the scanned Formato 1 — the case an academic programme referred to
 * the department head — while the plan is being drawn up.
 *
 * The file is only held here: the API files a signed copy against a plan that
 * already exists, so it is sent right after the plan is created (see
 * `PlanFormPage`). Validation runs on the way in rather than on submit, so a
 * wrong file is caught while the director is still looking at the picker.
 *
 * Unlike the other two, this form is never rendered by the system — it arrives
 * from the programme already filled in and signed — so the director has nothing
 * on screen telling them what they are being asked for. Hence the help and the
 * blank copy: recognising the form is the whole difficulty of this field.
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
        <div className="flex items-center gap-1">
          <h2 className="font-semibold">Formato 1 · Caso reportado</h2>

          <CaseReportHelp />
        </div>

        <p className="text-muted-foreground text-sm">
          Opcional. Adjunta el PDF del caso que el programa académico remitió a la dirección de
          departamento. Sólo lo ve la dirección: no se le muestra al docente.
        </p>

        <a
          href={TEMPLATE_URL}
          download="Formato 1 - Casos de docentes reportados.pdf"
          className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-sm font-medium underline hover:no-underline"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Descargar el formato en blanco
        </a>
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

/** What the Formato 1 is and who it comes from, for the director who has never seen one. */
function CaseReportHelp() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Qué es el Formato 1"
            className="text-muted-foreground/70 hover:text-foreground hover:bg-muted inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
          />
        }
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>

      <TooltipContent className="max-w-80">
        <span className="block">
          <strong>
            Casos de docentes reportados por programas académicos a las direcciones de departamento.
          </strong>{' '}
          Lo diligencia y firma el director o coordinador del programa, con la queja presentada y el
          acta del Comité Curricular donde se analizó el caso.
        </span>
        <span className="mt-1 block">
          Es el documento con el que el caso llega a la dirección de departamento, así que no lo
          genera la plataforma: aquí sólo se archiva el que ya viene firmado.
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
