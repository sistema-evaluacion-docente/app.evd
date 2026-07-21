import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge, DataTable, type DataTableColumn } from '@/shared/ui'
import { Search } from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState(ALL)
  const [category, setCategory] = useState(defaultCategory ? normalize(defaultCategory) : ALL)
  const [risk, setRisk] = useState(ALL)

  const subjectItems = useMemo(
    () => [
      { value: ALL, label: 'Todas las asignaturas' },
      ...[...new Set(comments.map((comment) => comment.subject))]
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return comments.filter(
      (comment) =>
        (!query || comment.text.toLowerCase().includes(query)) &&
        (subject === ALL || comment.subject === subject) &&
        (category === ALL || normalize(comment.categoryName) === category) &&
        (risk === ALL || (risk === UNCLASSIFIED ? comment.risk === null : comment.risk === risk)),
    )
  }, [comments, search, subject, category, risk])

  const isFiltered = filtered.length !== comments.length

  const columns: DataTableColumn<ProfessorComment>[] = [
    {
      header: 'Comentario',
      cellClassName: 'align-top py-4 max-w-[540px]',
      cell: (comment) => (
        <p className="text-foreground text-sm leading-relaxed" style={{ textWrap: 'pretty' }}>
          <span className="text-muted-foreground">"</span>
          {comment.text}
          <span className="text-muted-foreground">"</span>
        </p>
      ),
    },
    {
      header: 'Asignatura',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span
          className="text-foreground/80 block max-w-45 text-sm leading-snug break-words"
          style={{ textWrap: 'pretty' }}
        >
          {comment.subject}
        </span>
      ),
    },
    {
      header: 'Categoria',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="border-border bg-muted text-foreground/80 inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium whitespace-nowrap">
          {comment.categoryName}
        </span>
      ),
    },
    {
      header: 'Nivel de riesgo',
      cellClassName: 'align-top py-4',
      cell: (comment) => {
        const badge = professorRiskBadge(comment.risk)
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={badge.variant} className="min-w-16 justify-center">
              {badge.label}
            </Badge>
            {comment.confidence != null && (
              <span className="num text-muted-foreground text-xs tabular-nums">
                {comment.confidence}% confianza
              </span>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:p-7 sm:pb-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Comentarios de estudiantes</h2>

          <p className="text-muted-foreground mt-1 text-sm">
            Todos los comentarios del periodo, clasificados por categoria y nivel de riesgo.
          </p>
        </div>

        <span className="num text-muted-foreground shrink-0 text-sm font-medium tabular-nums">
          {isFiltered
            ? `${filtered.length} de ${comments.length} comentarios`
            : `${comments.length} comentarios`}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-5 sm:px-7 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
          />

          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por comentario..."
            aria-label="Buscar por comentario"
            className="pl-8"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:shrink-0">
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

          <Select
            items={RISK_ITEMS}
            value={risk}
            onValueChange={(value) => value && setRisk(value)}
          >
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
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(comment) => comment.id}
        headerVariant="muted"
        minWidth={760}
        emptyMessage={
          comments.length === 0
            ? 'No hay comentarios en el periodo seleccionado.'
            : category !== ALL && !search.trim() && subject === ALL && risk === ALL
              ? 'Esta categoria no tiene comentarios en el periodo seleccionado.'
              : 'No hay comentarios que coincidan con la busqueda o los filtros.'
        }
      />
    </Card>
  )
}
