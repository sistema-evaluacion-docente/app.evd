import { Card } from '@/components/ui/card'
import { PageHeader } from '@/shared/ui'
import { ChevronLeft, Download, InfoIcon, Users } from 'lucide-react'
import { Link } from 'wouter'
import { DropzoneArea } from './DropzoneArea'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useUploadPage } from '../hooks/useUploadPage'
import { ResultStats } from './ResultStats'
import { ResultTables } from './ResultTables'
import { UploadStatusCard } from './UploadStatusCard'

function UploadTeachersContent() {
  const {
    inputRef,
    dragOver,
    setDragOver,
    status,
    fileName,
    error,
    result,
    handleFile,
    handleReset,
    busy,
    ready,
    createdCount,
    skippedCount,
    errorsCount,
  } = useUploadPage()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Carga de Docentes"
        actions={
          <Link href="/teachers">
            <Button variant="ghost" size="sm">
              <ChevronLeft size={14} /> Volver a Docentes
            </Button>
          </Link>
        }
      />

      <Alert className="flex items-center justify-between border bg-amber-50 p-4">
        <div className="flex items-start gap-4">
          <InfoIcon />

          <div>
            <AlertTitle className="text-base font-semibold">Descargar Plantilla</AlertTitle>

            <AlertDescription className="text-muted-foreground text-sm">
              Descargue el archivo de ejemplo para conocer la estructura correcta y los campos requeridos en la carga masiva de docentes.
            </AlertDescription>
          </div>
        </div>

        <div>
          <a download href="/DocentesEjemplo.csv">
            <Button variant="outline" size="sm" className="bg-amber-200/50 text-amber-700 border border-amber-300 hover:bg-amber-300/70 hover:text-amber-700">
              <Download size={14} /> Descargar CSV de ejemplo
            </Button>
          </a>
        </div>
      </Alert>

      <DropzoneArea
        dragOver={dragOver}
        busy={busy}
        inputRef={inputRef}
        onDragOverChange={setDragOver}
        onFileSelected={handleFile}
      />

      {status !== 'idle' && (
        <UploadStatusCard status={status} fileName={fileName} error={error} onReset={handleReset} />
      )}

      {ready && (
        <ResultStats
          createdCount={createdCount}
          skippedCount={skippedCount}
          errorsCount={errorsCount}
        />
      )}

      {ready && (createdCount > 0 || skippedCount > 0 || errorsCount > 0) && (
        <ResultTables result={result!} />
      )}

      {!ready && status !== 'error' && status !== 'idle' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {['Creados', 'Omitidos', 'Errores'].map((label) => (
            <Card key={label} className="border-dashed p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                  {label}
                </div>

                <div className="bg-muted text-muted-foreground inline-flex h-9 w-9 items-center justify-center rounded-md">
                  <Users size={18} />
                </div>
              </div>

              <div className="num text-muted-foreground mt-5 text-[40px] leading-none font-semibold tracking-tight">
                —
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="animate-fade-in flex flex-col justify-center gap-3 pt-2 text-center sm:flex-row sm:items-center">
        <div className="text-muted-foreground text-sm">
          {status === 'idle' &&
            'Esperando archivo. Use el área superior para subir un Excel con los docentes.'}

          {status === 'uploading' && 'Procesando subida del archivo…'}

          {status === 'success' &&
            'Archivo procesado. Los docentes creados ya están disponibles en el sistema.'}

          {status === 'error' && 'Corrija el archivo e intente nuevamente.'}
        </div>
      </div>
    </div>
  )
}

export default UploadTeachersContent
