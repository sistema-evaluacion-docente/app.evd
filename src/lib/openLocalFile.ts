/**
 * Opens a file the user just picked in a new tab.
 *
 * The plans module opens *uploaded* documents through `openPendingTab`, which
 * exists because those live behind the Bearer token and only become an object
 * URL once the download lands. A file staged in a dropzone is already in
 * memory, so there is nothing to wait for and no holding page to show.
 *
 * The object URL is revoked on the same 60-second grace `openPendingTab` uses:
 * the tab has the file by then, and keeping the blob alive only leaks it.
 *
 * @example
 * <Button onClick={() => openLocalFile(file)}>Ver</Button>
 */
export function openLocalFile(file: File): void {
  const url = URL.createObjectURL(file)

  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
