/** Shared model for the manual + CSV account-upload flows (directors / teachers). */

export const ACCOUNT_VINCULACIONES = [
  'Tiempo Completo',
  'Medio Tiempo',
  'Catedrático',
  'Ocasional',
]

export interface AccountFormValues {
  codigo: string
  nombre: string
  email: string
  vinculacion: string
  /** Faculty (directors) or program (teachers). */
  extra: string
}

export interface AccountCsvRow {
  codigo: string
  nombre: string
  email: string
  vinculacion: string
}

export interface ParsedAccountRow extends AccountCsvRow {
  errors: string[]
}

export interface AccountUploadConfig {
  /** Regex the institutional code must match. */
  codeRegex: RegExp
  /** Human-readable code format, e.g. `DIR-XXXX`. */
  codeFormatHint: string
  codePlaceholder: string
  /** Label + options for the role-specific extra select (faculty / program). */
  extraLabel: string
  extraOptions: string[]
  extraHelp?: string
  csvTemplate: string
  csvFileName: string
  /** Example data rows shown in the "expected format" reference block. */
  csvExampleLines: string[]
  entitySingular: string
  entityPlural: string
}
