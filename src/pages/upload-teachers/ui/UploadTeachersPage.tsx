import { Building2, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'

import {
  CsvAccountUpload,
  ManualAccountForm,
  type AccountCsvRow,
  type AccountFormValues,
  type AccountUploadConfig,
} from '@/features/account-upload'
import { useToast } from '@/shared/lib/use-toast'
import {
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

const FACULTY = 'Facultad de Ingeniería'

const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Ingeniería Civil',
  'Ingeniería Electrónica',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
]

const CSV_EXAMPLE_LINES = [
  'DOC-2031,Dra. Elena Ramírez,e.ramirez@universidad.edu.co,Tiempo Completo',
  'DOC-2032,Ing. Andrés Posada,a.posada@universidad.edu.co,Catedrático',
  'DOC-2033,Mg. Camila Mosquera,c.mosquera@universidad.edu.co,Medio Tiempo',
]

const TEACHER_CONFIG: AccountUploadConfig = {
  codeRegex: /^DOC-\d{3,5}$/i,
  codeFormatHint: 'DOC-XXXX',
  codePlaceholder: 'DOC-2031',
  extraLabel: 'Programa',
  extraOptions: PROGRAMS,
  extraHelp: 'Programa adscrito al departamento',
  csvFileName: 'plantilla_docentes.csv',
  csvTemplate: `codigo,nombre,email,vinculacion\n${CSV_EXAMPLE_LINES.join('\n')}`,
  csvExampleLines: CSV_EXAMPLE_LINES,
  entitySingular: 'docente',
  entityPlural: 'docentes',
}

interface TeacherRecord {
  id: string
  codigo: string
  nombre: string
  email: string
  vinculacion: string
  programa: string
  addedAt: string
  status: 'active' | 'pending'
}

const INITIAL_TEACHERS: TeacherRecord[] = [
  { id: 'DOC-2014', codigo: 'DOC-2014', nombre: 'Dra. Patricia Salgado', email: 'p.salgado@universidad.edu.co', vinculacion: 'Tiempo Completo', programa: 'Ingeniería de Sistemas', addedAt: 'Hace 12 min', status: 'active' },
  { id: 'DOC-2015', codigo: 'DOC-2015', nombre: 'Ing. Jorge Iván Méndez', email: 'j.mendez@universidad.edu.co', vinculacion: 'Catedrático', programa: 'Ingeniería Industrial', addedAt: 'Hace 1 hora', status: 'pending' },
  { id: 'DOC-2016', codigo: 'DOC-2016', nombre: 'Mg. Lucía Herrera', email: 'l.herrera@universidad.edu.co', vinculacion: 'Medio Tiempo', programa: 'Ingeniería Civil', addedAt: 'Hace 3 horas', status: 'active' },
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

export function UploadTeachersPage() {
  const [mode, setMode] = useState('manual')
  const [teachers, setTeachers] = useState<TeacherRecord[]>(INITIAL_TEACHERS)
  const [search, setSearch] = useState('')
  const { toast, showToast } = useToast()

  const handleCreate = (values: AccountFormValues) => {
    setTeachers((prev) => [
      {
        id: values.codigo,
        codigo: values.codigo,
        nombre: values.nombre,
        email: values.email,
        vinculacion: values.vinculacion,
        programa: values.extra,
        addedAt: 'Hace unos segundos',
        status: 'pending',
      },
      ...prev,
    ])
    showToast(`Docente ${values.codigo} creado · invitación enviada`)
  }

  const handleImport = (rows: AccountCsvRow[]) => {
    setTeachers((prev) => [
      ...rows.map((row) => ({
        id: row.codigo,
        ...row,
        programa: PROGRAMS[Math.floor(Math.random() * PROGRAMS.length)],
        addedAt: 'Hace unos segundos',
        status: 'pending' as const,
      })),
      ...prev,
    ])
    showToast(
      `${rows.length} ${rows.length === 1 ? 'docente importado' : 'docentes importados'} correctamente`,
    )
  }

  const handleRemove = (id: string) => {
    setTeachers((prev) => prev.filter((teacher) => teacher.id !== id))
    showToast('Docente eliminado', 'warning')
  }

  const filtered = useMemo(() => {
    if (!search) return teachers
    const query = search.toLowerCase()
    return teachers.filter(
      (teacher) =>
        teacher.nombre.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        teacher.codigo.toLowerCase().includes(query),
    )
  }, [teachers, search])

  const columns: DataTableColumn<TeacherRecord>[] = [
    {
      header: 'Docente',
      cell: (teacher) => (
        <div className="flex items-center gap-3">
          <Avatar name={teacher.nombre} size={36} />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink-900">
              {teacher.nombre}
            </div>
            <div className="text-[12px] text-ink-500">{teacher.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Código',
      cell: (teacher) => (
        <span className="num font-medium tabular-nums text-ink-800">
          {teacher.codigo}
        </span>
      ),
    },
    {
      header: 'Vinculación',
      cell: (teacher) => (
        <Badge
          variant="outline"
          className="text-[12px] font-medium normal-case tracking-normal"
        >
          {teacher.vinculacion}
        </Badge>
      ),
    },
    {
      header: 'Programa',
      cell: (teacher) => (
        <span className="text-[13px] text-ink-700">{teacher.programa}</span>
      ),
    },
    {
      header: 'Estado',
      cell: (teacher) => <StatusPill status={teacher.status} />,
    },
    {
      header: 'Creado',
      cell: (teacher) => (
        <span className="text-[12.5px] text-ink-500">{teacher.addedAt}</span>
      ),
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (teacher) => (
        <button
          type="button"
          onClick={() => handleRemove(teacher.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-brand-50 hover:text-brand-700"
          aria-label={`Eliminar ${teacher.nombre}`}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  return (
    <AppLayout
      role="director"
      mainClassName="max-w-[1200px] space-y-5"
      header={{
        userName: 'Director Depto.',
        userRole: FACULTY,
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link href="/teachers" className="transition-colors hover:text-ink-900">
              Docentes
            </Link>
            <ChevronRight size={12} className="text-ink-300" />
            <span className="font-medium text-ink-900">Cargar docentes</span>
          </>
        ),
      }}
    >
      <PageHeader
        title="Cargar Docentes"
        description={
          <>
            Registre los docentes de su departamento. Los docentes creados se
            asignan automáticamente a la{' '}
            <span className="font-semibold text-ink-700">{FACULTY}</span>.
          </>
        }
        actions={
          <Link
            href="/teachers"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:bg-ink-50"
          >
            <ChevronLeft size={14} /> Volver a Docentes
          </Link>
        }
      />

      <SegmentedTabs
        value={mode}
        onChange={setMode}
        tabs={[
          { value: 'manual', label: 'Carga manual', description: 'Un docente a la vez' },
          { value: 'masiva', label: 'Carga masiva', description: 'Importar desde CSV' },
        ]}
      />

      {mode === 'manual' ? (
        <ManualAccountForm
          config={TEACHER_CONFIG}
          title="Agregar docente manualmente"
          subtitle="Registre un nuevo docente del departamento."
          footerNote="El docente recibirá un correo institucional con sus credenciales de acceso."
          headerRight={
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink-100 px-2.5 text-[11px] font-medium text-ink-700">
              <Building2 size={12} /> {FACULTY}
            </span>
          }
          onCreate={handleCreate}
        />
      ) : (
        <CsvAccountUpload config={TEACHER_CONFIG} onImport={handleImport} />
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-[16px] font-semibold text-ink-900">
              Docentes registrados recientemente
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Total:{' '}
              <span className="num font-semibold tabular-nums text-ink-800">
                {teachers.length}
              </span>{' '}
              · {FACULTY}
            </p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar docentes..."
            icon={<Search size={14} />}
            className="sm:w-[240px]"
          />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(teacher) => teacher.id}
          minWidth={860}
          rowClassName="h-[64px]"
          emptyMessage="Sin docentes para este filtro."
        />
      </Card>

      <AppFooter>
        Director · {FACULTY} · Sistema de Evaluación Docente · v2.1
      </AppFooter>
      <Toast toast={toast} />
    </AppLayout>
  )
}
