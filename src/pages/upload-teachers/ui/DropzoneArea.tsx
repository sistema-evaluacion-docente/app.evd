import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileSpreadsheet, FileUp } from 'lucide-react'
import type { RefObject } from 'react'

interface DropzoneAreaProps {
  dragOver: boolean
  busy: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onDragOverChange: (over: boolean) => void
  onFileSelected: (file: File | undefined) => void
}

export function DropzoneArea({
  dragOver,
  busy,
  inputRef,
  onDragOverChange,
  onFileSelected,
}: DropzoneAreaProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          if (!busy) onDragOverChange(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => onDragOverChange(false)}
        onDrop={(event) => {
          event.preventDefault()
          onDragOverChange(false)
          if (!busy) onFileSelected(event.dataTransfer.files[0])
        }}
        className={cn(
          'grid min-h-[50dvh] place-items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14',
          dragOver ? 'border-brand-600 bg-brand-50/60' : 'border-brand-200 bg-brand-50/10',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        <div>
          <div className="bg-brand-50 text-brand-600 inline-flex h-16 w-16 items-center justify-center rounded-xl">
            <FileUp size={28} strokeWidth={1.75} />
          </div>

          <h3 className="mt-5 text-[18px] font-semibold tracking-tight">
            Arrastre su archivo aquí
          </h3>

          <p className="text text-muted-foreground mt-1.5">
            Formatos aceptados:{' '}
            <span className="text-brand-500 font-medium">.xlsx · .xls · .csv</span>
            {' · '}
            <span className="text-brand-500 font-medium">Máx. 5MB</span>
          </p>

          <Button
            size="lg"
            disabled={busy}
            className="mt-6 px-5"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet size={16} />
            Seleccionar Archivo Excel
          </Button>

          <p className="text-muted-foreground mt-5 text-xs">
            Columnas requeridas: nombre, email, codigo institucional, tipo de contrato
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(event) => onFileSelected(event.target.files?.[0])}
          />
        </div>
      </div>
    </Card>
  )
}
