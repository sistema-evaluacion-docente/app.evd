/** A tab opened ahead of the file it will show. */
export interface PendingTab {
  /** Points the tab at the file once it has been fetched. */
  settle: (url: string) => void
  /** Closes the tab when the file never arrived. */
  fail: () => void
}

/** Holding page shown while the file downloads, in the visitor's own theme. */
function holdingPage(message: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${message}</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        font: 500 0.875rem/1.4 system-ui, sans-serif;
        color: #71717a;
        background: #fafafa;
      }
      @media (prefers-color-scheme: dark) {
        body { color: #a1a1aa; background: #18181b; }
      }
      .spinner {
        width: 1.15rem;
        height: 1.15rem;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="spinner"></div>
    <p>${message}</p>
  </body>
</html>`
}

/**
 * Opens a new tab for a file that is still being downloaded.
 *
 * Files behind the Bearer token have no URL to link to, so they are fetched as
 * a blob and handed over as an object URL — which only exists once the download
 * lands. The tab has to be opened before that, while the click is still a user
 * gesture, or the popup blocker eats it; opening it empty leaves the reader
 * staring at a white screen for as long as the file takes, which reads as a
 * page that broke. So it is opened with a holding message and the file is
 * pushed in over it.
 *
 * @example
 * const tab = openPendingTab('Abriendo el documento…')
 * previewSigned.mutate(format.slug, { onSuccess: tab.settle, onError: tab.fail })
 */
export function openPendingTab(message = 'Abriendo el documento…'): PendingTab {
  const tab = window.open('', '_blank')

  // A blocked popup gives back `null`, and a tab can refuse to be written to
  // (sandboxed opener); neither is worth failing the preview over.
  try {
    tab?.document.write(holdingPage(message))
    tab?.document.close()
  } catch {
    /* The tab still works as a plain target for the file. */
  }

  return {
    settle(url) {
      if (tab && !tab.closed) tab.location.href = url
      else window.open(url, '_blank')

      // The tab holds the file by now; keeping the blob alive only leaks it.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    },
    fail() {
      tab?.close()
    },
  }
}
