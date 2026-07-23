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
import type { ResponseAPI } from '@/shared/types/Response'
import type { UseQueryResult } from '@tanstack/react-query'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { normalize, professorRiskBadge, type ProfessorComment } from '../../model/professorSummary'

export interface ProfessorCommentsTableProps {
  comments: ProfessorComment[]
  categories?: readonly { name: string }[]
  defaultCategory?: string
}

const ALL = 'all'
const UNCLASSIFIED = 'sin-clasificar'

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
        <p
          className="text-foreground max-w-130 text-sm leading-relaxed"
          style={{ textWrap: 'pretty' }}
        >
          <Popover>
            <PopoverTrigger className="cursor-pointer transition-opacity hover:opacity-80">
              <span className="text-muted-foreground">"</span>
              {row.original.text?.length > 200
                ? `${row.original.text.slice(0, 200)}...`
                : row.original.text}
              <span className="text-muted-foreground">"</span>
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
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="border-border bg-muted text-foreground/80 inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium whitespace-nowrap">
          {row.original.categoryName}
        </span>
      ),
    },
    {
      accessorKey: 'risk',
      header: 'Nivel de riesgo',
      cell: ({ row }) => {
        const badge = professorRiskBadge(row.original.risk)

        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={badge.variant} className="min-w-16 justify-center">
              {badge.label}
            </Badge>

            {row.original.confidence != null && (
              <span className="num text-muted-foreground text-xs tabular-nums">
                {row.original.confidence}% confianza
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
          Todos los comentarios del periodo, clasificados por categoria y nivel de riesgo. (
          {comments.length} comentarios)
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
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
        />
      </CardContent>
    </Card>
  )
}
