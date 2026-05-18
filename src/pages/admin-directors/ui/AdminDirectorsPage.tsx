import { Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  CsvAccountUpload,
  ManualAccountForm,
  type AccountCsvRow,
  type AccountFormValues,
  type AccountUploadConfig,
} from '@/features/account-upload'
import { useToast } from '@/shared/lib/use-toast'
import {
  AdminViewBadge,
  AppFooter,
  Avatar,
  Badge,
  Card,
  DataTable,
  Input,
  PageHeader,
  SegmentedTabs,
  Toast,
  type DataTableColumn,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

const FACULTADES = [
  'Facultad de Ingeniería',
  'Facultad de Ciencias',
  'Facultad de Educación',
  'Facultad de Derecho',
  'Facultad de Ciencias Económicas',
  'Facultad de Artes y Humanidades',
  'Facultad de Medicina',
]

const CSV_EXAMPLE_LINES = [
  'DIR-1024,Dra. Marta Hernández,m.hernandez@universidad.edu.co,Tiempo Completo',
  'DIR-1025,Ing. Andrés Cifuentes,a.cifuentes@universidad.edu.co,Catedrático',
  'DIR-1026,Mg. Camila Salgado,c.salgado@universidad.edu.co,Medio Tiempo',
]

const DIRECTOR_CONFIG: AccountUploadConfig = {
  codeRegex: /^DIR-\d{3,5}$/i,
  codeFormatHint: 'DIR-XXXX',
  codePlaceholder: 'DIR-1024',
  extraLabel: 'Facultad asignada',
  extraOptions: FACULTADES,
  csvFileName: 'plantilla_directores.csv',
  csvTemplate: `codigo,nombre,email,vinculacion\n${CSV_EXAMPLE_LINES.join('\n')}`,
  csvExampleLines: CSV_EXAMPLE_LINES,
  entitySingular: 'director',
  entityPlural: 'directores',
}

interface DirectorRecord {
  id: string
  codigo: string
  nombre: string
  email: string
  vinculacion: string
  facultad: string
  status: 'active' | 'pending'
}

const INITIAL_DIRECTORS: DirectorRecord[] = [
  { id: 'DIR-1018', codigo: 'DIR-1018', nombre: 'Dr. Eduardo Vargas', email: 'e.vargas@universidad.edu.co', vinculacion: 'Tiempo Completo', facultad: 'Facultad de Ingeniería', status: 'active' },
  { id: 'DIR-1019', codigo: 'DIR-1019', nombre: 'Dra. Lina Castro', email: 'l.castro@universidad.edu.co', vinculacion: 'Catedrático', facultad: 'Facultad de Ciencias', status: 'active' },
  { id: 'DIR-1020', codigo: 'DIR-1020', nombre: 'Mg. Felipe Rojas', email: 'f.rojas@universidad.edu.co', vinculacion: 'Medio Tiempo', facultad: 'Facultad de Educación', status: 'pending' },
]

function StatusPill({ status }: { status: 'active' | 'pending' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 text-[11px] font-semibold uppercase text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Activo
      </span>
    )
  }
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-2.5 text-[11px] font-semibold uppercase text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pendiente
    </span>
  )
}

export function AdminDirectorsPage() {
  const [mode, setMode] = useState('manual')
  const [directors, setDirectors] = useState<DirectorRecord[]>(INITIAL_DIRECTORS)
  const [search, setSearch] = useState('')
  const { toast, showToast } = useToast()

  const handleCreate = (values: AccountFormValues) => {
    setDirectors((prev) => [
      {
        id: values.codigo,
        codigo: values.codigo,
        nombre: values.nombre,
        email: values.email,
        vinculacion: values.vinculacion,
        facultad: values.extra,
        status: 'pending',
      },
      ...prev,
    ])
    showToast(`Director ${values.codigo} creado · correo de activación enviado`)
  }

  const handleImport = (rows: AccountCsvRow[]) => {
    setDirectors((prev) => [
      ...rows.map((row) => ({
        id: row.codigo,
        ...row,
        facultad: FACULTADES[Math.floor(Math.random() * FACULTADES.length)],
        status: 'pending' as const,
      })),
      ...prev,
    ])
    showToast(
      `${rows.length} ${rows.length === 1 ? 'director importado' : 'directores importados'} correctamente`,
    )
  }

  const handleRemove = (id: string) => {
    setDirectors((prev) => prev.filter((director) => director.id !== id))
    showToast('Director eliminado', 'warning')
  }

  const filtered = useMemo(() => {
    if (!search) return directors
    const query = search.toLowerCase()
    return directors.filter(
      (director) =>
        director.nombre.toLowerCase().includes(query) ||
        director.email.toLowerCase().includes(query) ||
        director.codigo.toLowerCase().includes(query),
    )
  }, [directors, search])

  const columns: DataTableColumn<DirectorRecord>[] = [
    {
      header: 'Director',
      cell: (director) => (
        <div className="flex items-center gap-3">
          <Avatar name={director.nombre} size={36} />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink-900">
              {director.nombre}
            </div>
            <div className="text-[12px] text-ink-500">{director.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Código',
      cell: (director) => (
        <span className="num font-medium tabular-nums text-ink-800">
          {director.codigo}
        </span>
      ),
    },
    {
      header: 'Vinculación',
      cell: (director) => (
        <Badge
          variant="outline"
          className="text-[12px] font-medium normal-case tracking-normal"
        >
          {director.vinculacion}
        </Badge>
      ),
    },
    {
      header: 'Facultad',
      cell: (director) => (
        <span className="text-[13px] text-ink-700">{director.facultad}</span>
      ),
    },
    {
      header: 'Estado',
      cell: (director) => <StatusPill status={director.status} />,
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (director) => (
        <button
          type="button"
          onClick={() => handleRemove(director.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-brand-50 hover:text-brand-700"
          aria-label={`Eliminar ${director.nombre}`}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  return (
    <AppLayout
      role="admin"
      mainClassName="max-w-[1200px] space-y-5"
      header={{
        userName: 'Super Administrador',
        userRole: 'División de Sistemas',
      }}
    >
      <PageHeader
        badge={<AdminViewBadge />}
        title="Subir Directores de Departamento"
        description="Cree cuentas para los directores que gestionarán cada departamento en el sistema de evaluación. Use carga manual para uno a la vez o CSV para grandes lotes."
        actions={
          <div className="flex flex-col items-end gap-1">
            <div className="num text-[36px] font-semibold leading-none tabular-nums text-ink-900">
              {directors.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Directores registrados
            </div>
          </div>
        }
      />

      <SegmentedTabs
        value={mode}
        onChange={setMode}
        tabs={[
          { value: 'manual', label: 'Carga manual', description: 'Un director a la vez' },
          { value: 'masiva', label: 'Carga masiva', description: 'Importar desde CSV' },
        ]}
      />

      {mode === 'manual' ? (
        <ManualAccountForm
          config={DIRECTOR_CONFIG}
          title="Agregar director manualmente"
          subtitle="Complete los datos para registrar un nuevo director de departamento."
          footerNote="Se enviará un correo de activación a la dirección institucional al guardar."
          onCreate={handleCreate}
        />
      ) : (
        <CsvAccountUpload config={DIRECTOR_CONFIG} onImport={handleImport} />
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-[16px] font-semibold text-ink-900">
              Directores registrados
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Total:{' '}
              <span className="num font-semibold tabular-nums text-ink-800">
                {directors.length}
              </span>{' '}
              · ordenados por más reciente
            </p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar..."
            icon={<Search size={14} />}
            className="sm:w-[220px]"
          />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(director) => director.id}
          minWidth={820}
          rowClassName="h-[64px]"
          emptyMessage="Sin directores para este filtro."
        />
      </Card>

      <AppFooter>Super Admin · División de Sistemas · v2.1</AppFooter>
      <Toast toast={toast} />
    </AppLayout>
  )
}
