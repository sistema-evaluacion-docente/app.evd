import { ACCOUNT_VINCULACIONES, type AccountCsvRow } from '../model'

/** Parse CSV text, handling quoted fields that contain commas. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        out.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    out.push(current.trim())
    return out
  }

  return {
    headers: parseLine(lines[0]).map((header) => header.toLowerCase()),
    rows: lines.slice(1).map(parseLine),
  }
}

/** Validate a single account row; returns a list of human-readable errors. */
export function validateAccountRow(
  row: AccountCsvRow,
  codeRegex: RegExp,
  codeFormatHint: string,
): string[] {
  const errors: string[] = []

  if (!row.codigo) errors.push('Falta código')
  else if (!codeRegex.test(row.codigo)) {
    errors.push(`Formato de código inválido (${codeFormatHint})`)
  }

  if (!row.nombre) errors.push('Falta nombre')

  if (!row.email) errors.push('Falta email')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push('Email inválido')
  } else if (!/(universidad|edu)\./i.test(row.email)) {
    errors.push('Debe ser correo institucional')
  }

  if (!row.vinculacion) errors.push('Falta vinculación')
  else if (
    !ACCOUNT_VINCULACIONES.some(
      (option) => option.toLowerCase() === row.vinculacion.toLowerCase(),
    )
  ) {
    errors.push('Vinculación no reconocida')
  }

  return errors
}

/** Trigger a browser download of a generated CSV file. */
export function downloadCsv(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
