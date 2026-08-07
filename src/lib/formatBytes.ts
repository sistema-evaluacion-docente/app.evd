/**
 * Formats a byte count into a compact human-readable size (B, KB or MB).
 *
 * @param bytes - The number of bytes to format.
 * @returns A formatted size string, e.g. "12.5 KB" or "2.34 MB".
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
