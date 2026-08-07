import { Download, FileWarning } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface EvaluationPdfViewerProps {
  /** Object URL of the already-fetched PDF; `null` while it is not available. */
  url: string | null
  isPending?: boolean
  /** Message shown instead of the document (permissions, missing file…). */
  error?: string | null
  /** Filename suggested when downloading. Defaults to `evaluacion.pdf`. */
  fileName?: string
  /** Toolbar heading, e.g. the period name. */
  title?: ReactNode
  /** Extra toolbar content, rendered before the download button. */
  actions?: ReactNode
  /** Toolbar with title, open-in-tab and download. Defaults to `true`. */
  showToolbar?: boolean
  /** Classes for the document frame — set the height here. */
  frameClassName?: string
  className?: string
}

/**
 * Renders an already-fetched PDF in an embedded frame, with a toolbar to open
 * it in a new tab or download it. Purely presentational: it takes an object URL
 * and the query flags, so it works with any source and never fetches on its own.
 *
 * @example
 * <EvaluationPdfViewer url={url} isPending={isPending} title="2025-1" />
 *
 * @example
 * <EvaluationPdfViewer url={url} frameClassName="h-[70vh]" showToolbar={false} />
 */
export function EvaluationPdfViewer({
  url,
  isPending = false,
  error = null,
  fileName = 'evaluacion.pdf',
  title,
  actions,
  showToolbar = true,
  frameClassName,
  className,
}: EvaluationPdfViewerProps) {
  return (
    <section
      className={cn('border-border bg-background overflow-hidden rounded-md border', className)}
    >
      {showToolbar && (
        <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
          <p className="text-muted-foreground min-w-0 truncate text-xs font-medium tracking-wide uppercase">
            {title ?? 'Documento original'}
          </p>

          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
      )}

      <div className={cn('h-[75vh]', frameClassName)}>
        {isPending && <Skeleton className="size-full rounded-none" />}

        {!isPending && error && (
          <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
            <FileWarning className="text-muted-foreground/50 size-6" aria-hidden="true" />
            <p className="max-w-sm text-sm text-balance">{error}</p>
          </div>
        )}

        {!isPending && !error && url && (
          <object
            data={url}
            type="application/pdf"
            className="size-full"
            aria-label="Documento PDF"
          >
            <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm">Su navegador no puede mostrar el PDF incrustado.</p>

              <Button size="sm" render={<a href={url} download={fileName} />}>
                <Download className="size-4" aria-hidden="true" />
                Descargar el documento
              </Button>
            </div>
          </object>
        )}
      </div>
    </section>
  )
}
