import { pdf } from '@react-pdf/renderer'
import { FileDown } from 'lucide-react'
import { useState, type RefObject } from 'react'
import { toast } from 'sonner'

import { LoadingButton } from '@/components/common/LoadingButton'
import { captureChartImage } from '@/lib/pdf/captureChartImage'
import { downloadBlob } from '@/lib/downloadBlob'

/** `pdf()`'s own parameter type — react-pdf ships its types as a namespace
 *  (`export =`), which doesn't expose `DocumentProps` as a plain named type
 *  import, so this is derived structurally from the function itself instead. */
type PdfDocumentElement = Parameters<typeof pdf>[0]

export interface GenerateReportPdfButtonProps {
  label?: string
  /** No extension — `.pdf` is appended. */
  fileName: string
  /** One ref per chart card to snapshot; keys are passed through to `buildDocument`. */
  chartRefs: Record<string, RefObject<HTMLElement | null>>
  /** Assembles the `<PdfPage>` document once every chart has been captured. */
  buildDocument: (images: Record<string, string>) => PdfDocumentElement
  /**
   * Blocks generation, e.g. while data the report depends on (a full,
   * unpaginated list fetched only for the PDF) is still loading — a real
   * `disabled`, not just a dimmed `className`, since CSS `pointer-events`
   * only blocks the mouse and not a keyboard-triggered click on a focused
   * button.
   */
  disabled?: boolean
  className?: string
}

/**
 * Generates a downloadable PDF report with `@react-pdf/renderer`: forces
 * light mode (a report is always light regardless of the app's current
 * theme, restored afterwards), snapshots each chart card exactly as it's
 * already painted on screen via `captureChartImage` — no print-media resize,
 * so no race with Recharts' `ResponsiveContainer` — then hands those images
 * to `buildDocument` to assemble the PDF and downloads the result directly
 * (no print dialog).
 *
 * @example
 * <GenerateReportPdfButton
 *   fileName={`Resumen-Departamento-${departmentName}`}
 *   chartRefs={{ dimensions: dimensionsCardRef }}
 *   buildDocument={(images) => (
 *     <PdfPage title="Resumen del departamento">
 *       <PdfSection title="Promedios por dimensión pedagógica">
 *         <PdfChartImage src={images.dimensions} />
 *       </PdfSection>
 *     </PdfPage>
 *   )}
 * />
 */
export function GenerateReportPdfButton({
  label = 'Descargar PDF',
  fileName,
  chartRefs,
  buildDocument,
  disabled,
  className,
}: GenerateReportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleClick() {
    setIsGenerating(true)

    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    if (wasDark) root.classList.remove('dark')

    try {
      const entries = Object.entries(chartRefs)
      const captured = await Promise.all(
        entries.map(async ([key, ref]) => {
          if (!ref.current) throw new Error(`No se encontró la gráfica "${key}" para capturar.`)
          return [key, await captureChartImage(ref.current)] as const
        }),
      )
      const images = Object.fromEntries(captured)

      const blob = await pdf(buildDocument(images)).toBlob()
      downloadBlob(blob, `${fileName}.pdf`)
    } catch {
      toast.error('No se pudo generar el PDF. Intenta de nuevo.')
    } finally {
      if (wasDark) root.classList.add('dark')
      setIsGenerating(false)
    }
  }

  return (
    <LoadingButton
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      pending={isGenerating}
      pendingLabel="Generando…"
      disabled={disabled}
      className={className}
    >
      {!isGenerating && <FileDown className="size-4" aria-hidden="true" />}
      {!isGenerating && label}
    </LoadingButton>
  )
}
