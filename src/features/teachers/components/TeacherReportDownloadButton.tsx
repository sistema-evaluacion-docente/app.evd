import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { LoadingButton } from '@/components/common/LoadingButton'
import { ApiError } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { useDownloadTeacherEvaluationReport } from '../api'

export interface TeacherReportDownloadButtonProps {
  teacherId: number
  evaluationId: number
  className?: string
}

/** Turns the API failure into what the viewer can actually do about it. */
function messageFor(error: unknown) {
  const status = error instanceof ApiError ? error.status : undefined

  if (status === 403) return 'No tiene permiso para descargar este reporte.'
  if (status === 404) return 'No se encontró el reporte para este docente en este periodo.'

  return 'No fue posible descargar el reporte. Intente de nuevo en unos minutos.'
}

/**
 * Minimal standalone page written into the new tab the instant it opens, so
 * it never sits blank while the PDF is generated (~1–3s) — it has no access
 * to the app's React tree or theme, so it's plain HTML with its own dark-mode
 * media query instead of the app's CSS tokens.
 */
const LOADING_TAB_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Generando reporte…</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #ffffff;
    color: #333333;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #161b25; color: #e4e6ea; }
  }
  .wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(0, 0, 0, 0.12);
    border-top-color: #c93d2d;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @media (prefers-color-scheme: dark) {
    .spinner { border-color: rgba(255, 255, 255, 0.15); border-top-color: #dd4b39; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { margin: 0; font-size: 14px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="spinner" role="status" aria-label="Cargando"></div>
    <p>Descargando la evaluación docente...</p>
  </div>
</body>
</html>`

/** Opens a blank tab and immediately fills it with a loading page, instead of
 *  leaving it empty until the PDF is ready. */
function openLoadingTab(): Window | null {
  const tab = window.open('', '_blank')

  if (tab) {
    tab.document.write(LOADING_TAB_HTML)
    tab.document.close()
  }

  return tab
}

/**
 * Opens a teacher's evaluation report (their pages extracted from the
 * department's PDF for that period) in a new browser tab. The tab is opened
 * synchronously on click, before the fetch resolves, so the browser doesn't
 * treat it as an unrequested popup once the blob is ready — same pattern
 * already used for the improvement-plan document preview. Rather than
 * sitting blank while the backend generates the PDF (~1–3s), the tab shows
 * a small loading page until it's navigated to the real file.
 *
 * @example
 * <TeacherReportDownloadButton teacherId={teacher.teacher_id} evaluationId={teacher.evaluation_id} />
 */
export function TeacherReportDownloadButton({
  teacherId,
  evaluationId,
  className,
}: TeacherReportDownloadButtonProps) {
  const download = useDownloadTeacherEvaluationReport()

  function handleClick() {
    const tab = openLoadingTab()

    download.mutate(
      { teacherId, evaluationId },
      {
        onSuccess: (url) => {
          if (tab) tab.location.href = url
          else window.open(url, '_blank')

          // The tab holds the file by now; keeping the blob alive only leaks it.
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
        },
        onError: (error) => {
          tab?.close()
          toast.error(messageFor(error))
        },
      },
    )
  }

  return (
    <LoadingButton
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      pending={download.isPending}
      pendingLabel="Descargando…"
      className={cn(
        'hover:border-primary hover:bg-primary hover:text-primary-foreground',
        className,
      )}
    >
      <FileDown className="size-4" aria-hidden="true" />
      Descargar evaluación
    </LoadingButton>
  )
}
