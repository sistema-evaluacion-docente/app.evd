import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo, useState } from 'react'

import DataTable, { type DataTableAction } from '@/components/common/DataTable'
import {
  DateRangeFilter,
  OPERATIONS,
  TABLE_NAMES,
  useGetAudits,
  useLogsColumns,
  type Audit,
} from '@/features/audits'
import { PageHeader } from '@/shared/ui'
import { AuditDetailDrawer } from './AuditDetailDrawer'

function formatDate(date: Date | undefined): string | undefined {
  if (!date) return undefined

  return date.toISOString().split('T')[0]
}

export function LogsContent() {
  const columns = useLogsColumns()

  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [tableName, setTableName] = useState('')
  const [operation, setOperation] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const rowActions = useMemo<DataTableAction<Audit>[]>(
    () => [
      {
        label: 'Ver detalle',
        onClick: (audit) => {
          setSelectedAuditId(audit.id)
          setIsDrawerOpen(true)
        },
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="Logs del Sistema"
        description="Registro completo de actividades realizadas en la plataforma para auditoría y trazabilidad."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={tableName} onValueChange={(value) => setTableName(value ?? '')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas las tablas" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="">Todas las tablas</SelectItem>

            {TABLE_NAMES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={operation} onValueChange={(value) => setOperation(value ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="">Todas las acciones</SelectItem>

            {OPERATIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <DataTable
        key={`${tableName}-${operation}-${formatDate(startDate)}-${formatDate(endDate)}`}
        columns={columns}
        queryFn={useGetAudits}
        enableSearch
        searchPlaceholder="Buscar por descripción, elemento..."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        extraFilterParams={{
          table_name: tableName || undefined,
          operation: operation || undefined,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        }}
      />

      <AuditDetailDrawer
        open={isDrawerOpen}
        auditId={selectedAuditId}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) setSelectedAuditId(null)
        }}
      />
    </>
  )
}
