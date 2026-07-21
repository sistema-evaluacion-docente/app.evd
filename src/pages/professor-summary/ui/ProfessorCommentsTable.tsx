import { useMemo, useState } from 'react'

import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge, Card, DataTable, type DataTableColumn } from '@/shared/ui'

import { professorRiskBadge, type ProfessorComment } from '../model/data'

export interface ProfessorCommentsTableProps {
  comments: ProfessorComment[]
  /**
   * Categories to always offer in the filter, even those with no comments.
   * When omitted, the options are derived from the comments themselves.
   */
  categories?: readonly { name: string }[]
  /** Preselects the category filter by name (e.g. from a category detail). */
  defaultCategory?: string
}

const ALL = 'all'
const UNCLASSIFIED = 'sin-clasificar'

/** Categories are matched to comments by name, so compare them normalized. */
const norm = (value: string) => value.trim().toLowerCase()

const RISK_ITEMS = [
  { value: ALL, label: 'Todos los niveles' },
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Medio' },
  { value: 'bajo', label: 'Bajo' },
  { value: UNCLASSIFIED, label: 'Sin clasificar' },
]

/** All the period's student comments, tagged by category and risk level. */
export function ProfessorCommentsTable({
  comments,
  categories,
  defaultCategory,
}: ProfessorCommentsTableProps) {
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState(ALL)
  // The category filter is keyed by normalized name so a preselected category
  // matches its comments regardless of casing.
  const [category, setCategory] = useState(
    defaultCategory ? norm(defaultCategory) : ALL,
  )
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
    // Normalized name -> display name. Seed with the always-shown categories,
    // then let the comments' own labels win when they exist.
    const byKey = new Map<string, string>()
    for (const item of categories ?? []) byKey.set(norm(item.name), item.name)
    for (const comment of comments) {
      byKey.set(norm(comment.categoryName), comment.categoryName)
    }
    return [
      { value: ALL, label: 'Todas las categorías' },
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
        (category === ALL || norm(comment.categoryName) === category) &&
        (risk === ALL ||
          (risk === UNCLASSIFIED ? comment.risk === null : comment.risk === risk)),
    )
  }, [comments, search, subject, category, risk])

  const isFiltered = filtered.length !== comments.length

  const columns: DataTableColumn<ProfessorComment>[] = [
    {
      header: 'Comentario',
      cellClassName: 'align-top py-4 max-w-[540px]',
      cell: (comment) => (
        <p
          className="text-[13.5px] leading-relaxed text-ink-800"
          style={{ textWrap: 'pretty' }}
        >
          <span className="text-ink-400">“</span>
          {comment.text}
          <span className="text-ink-400">”</span>
        </p>
      ),
    },
    {
      header: 'Asignatura',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span
          className="block max-w-45 text-[13px] leading-snug break-words text-ink-700"
          style={{ textWrap: 'pretty' }}
        >
          {comment.subject}
        </span>
      ),
    },
    {
      header: 'Categoría',
      cellClassName: 'align-top py-4',
      cell: (comment) => (
        <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-ink-200 bg-ink-50/60 px-2.5 text-[11px] font-medium text-ink-700">
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
              <span className="num text-[11.5px] tabular-nums text-ink-500">
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
          <h2 className="text-[18px] font-semibold text-ink-900">
            Comentarios de estudiantes
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Todos los comentarios del periodo, clasificados por categoría y nivel de
            riesgo.
          </p>
        </div>
        <span className="num shrink-0 text-[13.5px] font-medium tabular-nums text-ink-500">
          {isFiltered
            ? `${filtered.length} de ${comments.length} comentarios`
            : `${comments.length} comentarios`}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-5 sm:px-7 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-400"
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
          <Select items={subjectItems} value={subject} onValueChange={(value) => value && setSubject(value)}>
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
          <Select items={categoryItems} value={category} onValueChange={(value) => value && setCategory(value)}>
            <SelectTrigger aria-label="Filtrar por categoría" className="w-full lg:w-52">
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
              ? 'Esta categoría no tiene comentarios en el periodo seleccionado.'
              : 'No hay comentarios que coincidan con la búsqueda o los filtros.'
        }
      />
    </Card>
  )
}
