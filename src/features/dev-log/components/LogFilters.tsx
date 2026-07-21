import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Search } from 'lucide-react'

import { CATEGORIES, METHODS } from '../hooks/useLogFilter'

interface LogFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  methodFilter: string
  onMethodFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
}

/**
 * LogFilters component provides UI controls for filtering log entries based on search, method, and category.
 *
 * @param search - The current search term.
 * @param onSearchChange - Callback function to handle changes to the search term.
 * @param methodFilter - The current method filter.
 * @param onMethodFilterChange - Callback function to handle changes to the method filter.
 * @param categoryFilter - The current category filter.
 * @param onCategoryFilterChange - Callback function to handle changes to the category filter.
 */
export function LogFilters({
  search,
  onSearchChange,
  methodFilter,
  onMethodFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: LogFiltersProps) {
  return (
    <div className="border-border flex items-center gap-2 border-b px-3 py-1.5">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />

        <Input
          value={search}
          placeholder="Buscar..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7 text-xs h-7"
        />
      </div>

      <Select value={methodFilter} onValueChange={(v) => onMethodFilterChange(v ?? '')}>
        <SelectTrigger className="h-7! w-24 text-xs">{methodFilter || 'Método'}</SelectTrigger>

        <SelectContent>
          <SelectItem value="">Todos</SelectItem>

          {METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={(v) => onCategoryFilterChange(v ?? '')}>
        <SelectTrigger className="h-7! w-24 text-xs">{categoryFilter || 'Categoría'}</SelectTrigger>

        <SelectContent>
          <SelectItem value="">Todas</SelectItem>

          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
