import { RefreshCw, RotateCcw, TriangleAlert } from 'lucide-react'
import type { FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'

/**
 * Whether the app failed because a piece of itself never arrived.
 *
 * Pages are loaded on demand, so a chunk can go missing mid-session for two
 * reasons: the connection dropped, or the app was redeployed while this tab was
 * open and the file names it remembers no longer exist. The hosting rewrite
 * sends anything unmatched to `index.html`, so a missing chunk comes back as
 * HTML with a 200 rather than a 404 — hence the parse errors below, which are
 * what the browser reports when it tries to run a page as a module.
 */
function isMissingChunk(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unexpected token '<'|MIME type/i.test(
    `${error.name}: ${error.message}`,
  )
}

/**
 * What replaces a page that could not be drawn.
 *
 * Split in two on purpose. A chunk that never arrived is almost always a new
 * deployment, and the only way out of that is a full reload: the `index.html`
 * this tab is running from is stale too, so re-rendering would ask for the same
 * missing file again. Every other error is worth one retry in place, which is
 * what `resetErrorBoundary` does.
 */
export function RouteError({ error, resetErrorBoundary }: FallbackProps) {
  const stale = isMissingChunk(error)

  return (
    <div role="alert" className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="bg-muted mb-5 flex size-16 items-center justify-center rounded-2xl">
        {stale ? (
          <RefreshCw className="text-muted-foreground size-7" aria-hidden="true" />
        ) : (
          <TriangleAlert className="text-muted-foreground size-7" aria-hidden="true" />
        )}
      </div>

      <h2 className="text-xl font-semibold tracking-tight">
        {stale ? 'Hay una versión nueva de la aplicación' : 'No pudimos mostrar esta página'}
      </h2>

      <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-sm">
        {stale
          ? 'Recarga para traerla. Si estabas escribiendo un plan, lo que llevabas se guarda en este navegador y volverá al abrir el formulario.'
          : 'Algo falló al dibujarla. Puedes intentarlo de nuevo; si vuelve a ocurrir, avísale al equipo.'}
      </p>

      {stale ? (
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Recargar
        </Button>
      ) : (
        <Button onClick={resetErrorBoundary}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Intentar de nuevo
        </Button>
      )}

      {/* The message itself, for whoever is being asked "what does it say?" over
          the phone. Not the stack: that is for the console, not the director. */}
      {error instanceof Error && error.message && (
        <p className="text-muted-foreground/70 mt-6 max-w-md font-mono text-xs wrap-break-words">
          {error.message}
        </p>
      )}
    </div>
  )
}
