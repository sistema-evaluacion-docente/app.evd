export const OPERATIONS = [
  { value: 'CREATE', label: 'Crear', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { value: 'UPDATE', label: 'Actualizar', bg: 'bg-sky-50', text: 'text-sky-700' },
  { value: 'DELETE', label: 'Eliminar', bg: 'bg-brand-50', text: 'text-brand-700' },
  { value: 'IMPORT', label: 'Importar', bg: 'bg-violet-50', text: 'text-violet-700' },
  { value: 'EXPORT', label: 'Exportar', bg: 'bg-amber-50', text: 'text-amber-700' },
] as const

/**
 * Get the label for a given operation.
 * @param operation - The operation to get the label for.
 * @returns The label for the operation.
 */
export const getOperation = (operation: string) => {
  const op = OPERATIONS.find((o) => o.value === operation)
  return op
}
