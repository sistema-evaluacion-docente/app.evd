import DataTable from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ResponseAPI } from '@/shared/types/Response'
import type { UseQueryResult } from '@tanstack/react-query'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalize, professorRiskBadge, type ProfessorComment } from '../../model/professorSummary'

const COLORS = {
  bajo: 'bg-green-200! text-green-700! border-green-200!',
  medio: 'bg-yellow-200! text-yellow-700! border-yellow-200!',
  alto: 'bg-red-200! text-red-700! border-red-200!',
}

export interface ProfessorCommentsTableProps {
  comments: ProfessorComment[]
  categories?: readonly { name: string }[]
  defaultCategory?: string
}

const ALL = 'all'
const UNCLASSIFIED = 'sin-clasificar'

const RISK_INFO = (
  <div className="space-y-3 text-sm leading-relaxed">
    <h5 className="text-foreground text-base font-semibold">Nivel de riesgo institucional</h5>

    <p className="text-muted-foreground mb-4">
      Esta clasificación se hace a partir del modelo <strong>DistilBETO</strong>, es solo una
      hipótesis de trabajo y no un veredicto. La clasificación puede ser incorrecta, por lo que se
      recomienda revisar los comentarios y no tomar decisiones únicamente con base en la
      clasificación automática.
    </p>

    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className={cn('mt-0.5 min-w-12 justify-center', COLORS.bajo)}>
          Bajo
        </Badge>

        <span>Comentario sin señales de riesgo institucional.</span>
      </div>

      <div className="flex items-start gap-2">
        <Badge variant="outline" className={cn('mt-0.5 min-w-12 justify-center', COLORS.medio)}>
          Medio
        </Badge>

        <span>Comentario con señales de atención moderada.</span>
      </div>

      <div className="flex items-start gap-2">
        <Badge variant="outline" className={cn('mt-0.5 min-w-12 justify-center', COLORS.alto)}>
          Alto
        </Badge>

        <span>
          Comentario con señales de riesgo que requieren atención institucional prioritaria.
        </span>
      </div>
    </div>

    <p className="text-muted-foreground border-t pt-2 text-xs">
      Modelo: <span className="text-foreground font-medium">DistilBETO</span>
    </p>
  </div>
)

const CATEGORY_INFO = (
  <div className="space-y-3 text-sm leading-relaxed">
    <h5 className="text-foreground text-base font-semibold">Categorías pedagógicas</h5>

    <table className="w-full border-separate border-spacing-0 text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-muted-foreground pr-4 pb-2 font-medium">Categoría</th>
          <th className="text-muted-foreground pb-2 font-medium">Descripción</th>
        </tr>
      </thead>

      <tbody className="divide-y">
        <tr>
          <td className="py-2 pr-4 align-top">
            <Badge variant="secondary" className="min-w-12 justify-center">
              Desarrollo del Conocimiento
            </Badge>
          </td>

          <td className="py-2 align-top">
            Presentación de la programación, dominio de los temas, capacidad de respuesta, relación
            con la vida real, expresión de ideas y generación de interés investigativo.
          </td>
        </tr>

        <tr>
          <td className="py-2 pr-4 align-top">
            <Badge variant="secondary" className="min-w-12 justify-center">
              Desempeño Docente
            </Badge>
          </td>

          <td className="py-2 align-top">
            Planeación de actividades, fomento a la participación, metodologías aplicadas, orden en
            la presentación, asistencia y puntualidad, asesoría, información bibliográfica y
            motivación generada en clase.
          </td>
        </tr>

        <tr>
          <td className="py-2 pr-4 align-top">
            <Badge variant="secondary" className="min-w-12 justify-center">
              Procesos de Evaluación
            </Badge>
          </td>

          <td className="py-2 align-top">
            Concordancia entre evaluación y contenido, claridad de criterios, entrega oportuna de
            resultados y espacios de reflexión sobre el rendimiento.
          </td>
        </tr>

        <tr>
          <td className="py-2 pr-4 align-top">
            <Badge variant="secondary" className="min-w-12 justify-center">
              Integración Interpersonal
            </Badge>
          </td>

          <td className="py-2 align-top">
            Apertura al diálogo, identidad institucional, respeto mutuo en el aula y consideración
            ante problemas sociales del estudiante.
          </td>
        </tr>

        <tr>
          <td className="py-2 pr-4 align-top">
            <Badge variant="secondary" className="min-w-12 justify-center">
              Sin Clasificación
            </Badge>
          </td>

          <td className="py-2 align-top">
            El sistema no pudo clasificar el comentario en ninguna de las categorías pedagógicas.
          </td>
        </tr>
      </tbody>
    </table>

    <p className="text-muted-foreground border-t pt-2 text-xs">
      Modelo: <span className="text-foreground font-medium">DistilBETO</span>
    </p>
  </div>
)

const RISK_ITEMS = [
  { value: ALL, label: 'Todos los niveles' },
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Medio' },
  { value: 'bajo', label: 'Bajo' },
  { value: UNCLASSIFIED, label: 'Sin clasificar' },
]

export function ProfessorCommentsTable({
  comments,
  categories,
  defaultCategory,
}: ProfessorCommentsTableProps) {
  const [subject, setSubject] = useState(ALL)
  const [category, setCategory] = useState(defaultCategory ? normalize(defaultCategory) : ALL)
  const [risk, setRisk] = useState(ALL)

  const subjectItems = useMemo(
    () => [
      { value: ALL, label: 'Todas las asignaturas' },
      ...[...new Set(comments.map((c) => c.subject))]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map((name) => ({ value: name, label: name })),
    ],
    [comments],
  )

  const categoryItems = useMemo(() => {
    const byKey = new Map<string, string>()
    for (const item of categories ?? []) byKey.set(normalize(item.name), item.name)
    for (const comment of comments) {
      byKey.set(normalize(comment.categoryName), comment.categoryName)
    }
    return [
      { value: ALL, label: 'Todas las categorias' },
      ...[...byKey.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'es'))
        .map(([value, label]) => ({ value, label })),
    ]
  }, [comments, categories])

  const columns: ColumnDef<ProfessorComment>[] = [
    {
      accessorKey: 'text',
      header: 'Comentario',
      cell: ({ row }) => (
        <p className="text-foreground max-w-130 text-left text-sm leading-relaxed">
          <Popover>
            <PopoverTrigger
              title={row.original.text}
              className="w-full cursor-pointer text-left transition-opacity hover:opacity-80"
            >
              {row.original.text?.length > 200
                ? `${row.original.text.slice(0, 200)}...`
                : row.original.text}
            </PopoverTrigger>

            <PopoverContent>
              <p className="text-foreground w-full max-w-130 text-sm leading-relaxed whitespace-pre-wrap">
                {row.original.text}
              </p>
            </PopoverContent>
          </Popover>
        </p>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Asignatura',
      cell: ({ row }) => (
        <span
          className="text-foreground/80 block max-w-45 text-sm leading-snug break-words"
          style={{ textWrap: 'pretty' }}
        >
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: () => (
        <div className="flex items-center gap-1.5">
          <span>Categoria</span>
          <Popover>
            <PopoverTrigger
              aria-label="Información sobre categorías"
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <Info size={14} />
            </PopoverTrigger>

            <PopoverContent side="bottom" align="start" className="w-80 md:w-150">
              {CATEGORY_INFO}
            </PopoverContent>
          </Popover>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary" className="min-w-16 justify-center">
            {row.original.categoryName}
          </Badge>

          {row.original.category_score != null && (
            <span className="num text-muted-foreground pl-2 text-xs text-nowrap tabular-nums">
              {(row.original.category_score * 100)?.toFixed(2)}% confianza
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'risk',
      header: () => (
        <div className="flex items-center gap-1.5">
          <span>Nivel de riesgo</span>
          <Popover>
            <PopoverTrigger
              aria-label="Información sobre nivel de riesgo"
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <Info size={14} />
            </PopoverTrigger>

            <PopoverContent side="bottom" align="start" className="w-80 md:w-120">
              {RISK_INFO}
            </PopoverContent>
          </Popover>
        </div>
      ),
      cell: ({ row }) => {
        const badge = professorRiskBadge(row.original.risk)

        return (
          <div className="flex flex-col items-start gap-1">
            <Badge
              variant="outline"
              className={cn(
                'min-w-16 justify-center',
                COLORS[row.original.risk as keyof typeof COLORS],
              )}
            >
              {badge.label}
            </Badge>

            {row.original.risk_score != null && (
              <span className="num text-muted-foreground pl-2 text-xs text-nowrap tabular-nums">
                {(row.original.risk_score * 100)?.toFixed(2)}% confianza
              </span>
            )}
          </div>
        )
      },
    },
  ]

  const filters = useMemo(
    () => (
      <>
        <Select
          items={subjectItems}
          value={subject}
          onValueChange={(value) => value && setSubject(value)}
        >
          <SelectTrigger aria-label="Filtrar por asignatura" className="w-full lg:w-52">
            <SelectValue />
          </SelectTrigger>

          <SelectContent alignItemWithTrigger={false} className="w-auto">
            {subjectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={categoryItems}
          value={category}
          onValueChange={(value) => value && setCategory(value)}
        >
          <SelectTrigger aria-label="Filtrar por categoria" className="w-full lg:w-52">
            <SelectValue />
          </SelectTrigger>

          <SelectContent alignItemWithTrigger={false} className="w-auto">
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select items={RISK_ITEMS} value={risk} onValueChange={(value) => value && setRisk(value)}>
          <SelectTrigger aria-label="Filtrar por nivel de riesgo" className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>

          <SelectContent alignItemWithTrigger={false}>
            {RISK_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </>
    ),
    [subject, category, risk, subjectItems, categoryItems],
  )

  const queryFn = useMemo(
    () =>
      function useProfessorCommentsQuery({
        page,
        limit,
        search: query,
        subject: subjectFilter,
        category: categoryFilter,
        risk: riskFilter,
      }: {
        page: number
        limit: number
        search: string
        subject?: string
        category?: string
        risk?: string
      }): UseQueryResult<ResponseAPI<ProfessorComment[]>> {
        return useQuery({
          queryKey: [
            'professor-comments',
            { comments, query, subjectFilter, categoryFilter, riskFilter, page, limit },
          ],

          queryFn: () => {
            const filtered = comments.filter((comment) => {
              const matchSearch = !query || comment.text.toLowerCase().includes(query.toLowerCase())
              const matchSubject =
                !subjectFilter || subjectFilter === ALL || comment.subject === subjectFilter
              const matchCategory =
                !categoryFilter ||
                categoryFilter === ALL ||
                normalize(comment.categoryName) === categoryFilter
              const matchRisk =
                !riskFilter || riskFilter === ALL
                  ? true
                  : riskFilter === UNCLASSIFIED
                    ? comment.risk === null
                    : comment.risk === riskFilter

              return matchSearch && matchSubject && matchCategory && matchRisk
            })

            const start = (page - 1) * limit
            const items = filtered.slice(start, start + limit)

            return {
              status: 'success' as const,
              message: '',
              data: items,
              pagination: {
                page,
                limit,
                total: filtered.length,
                pages: Math.ceil(filtered.length / limit),
              },
              error: null,
            }
          },
          placeholderData: keepPreviousData,
        })
      },
    [comments],
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Comentarios de estudiantes</CardTitle>
        <p className="text-muted-foreground text-sm">
          Todos los comentarios del periodo, clasificados por categoria y nivel de riesgo.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        <DataTable<ProfessorComment>
          columns={columns}
          queryFn={queryFn}
          extraFilterParams={{ subject, category, risk }}
          filters={filters}
          emptyMessage={
            comments.length === 0
              ? 'No hay comentarios en el periodo seleccionado.'
              : 'No hay comentarios que coincidan con la busqueda o los filtros.'
          }
          searchPlaceholder="Buscar por comentario..."
          enableSorting={false}
          cellClassName="align-top py-4"
          borders={false}
        />
      </CardContent>
    </Card>
  )
}
