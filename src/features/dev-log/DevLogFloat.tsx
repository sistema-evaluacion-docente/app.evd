import { cn } from '@/lib/utils'
import { Terminal } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useId, useState } from 'react'
import vsLight from 'react-syntax-highlighter/dist/esm/styles/prism/vs'
import vsDark from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus'

import { IS_DEVELOPMENT } from '@/config'
import useAuth from '@/shared/hooks/useAuth'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { LogDetailDialog } from './components/LogDetailDialog'
import { LogEntry } from './components/LogEntry'
import { LogFilters } from './components/LogFilters'
import { LogHeader } from './components/LogHeader'
import { useDevLogWebSocket } from './hooks/useDevLogWebSocket'
import { useLogFilter } from './hooks/useLogFilter'

export function DevLogFloat() {
  const { user } = useAuth()
  const { theme, systemTheme } = useTheme()

  const id = useId()

  const [isOpen, setIsOpen] = useLocalStorage('dev-log-float-open', false)
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null)

  const isAdmin = user?.roles?.includes('ADMIN') ?? false

  const { logs, status, clearLogs, logContainerRef } = useDevLogWebSocket({
    enabled: isAdmin,
  })

  const {
    search,
    setSearch,
    methodFilter,
    setMethodFilter,
    categoryFilter,
    setCategoryFilter,
    filteredLogs,
  } = useLogFilter(logs)

  const syntaxStyle =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark') ? vsDark : vsLight

  if (!isAdmin || !IS_DEVELOPMENT) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="border-border bg-card flex h-[calc(100dvh-6rem)] w-[calc(100dvw-2rem)] flex-col overflow-hidden rounded-lg border shadow-lg md:h-[calc(50dvh)] md:w-130 md:max-w-xl">
          <LogHeader
            status={status}
            onClear={clearLogs}
            onClose={() => setIsOpen(false)}
            logsCount={logs?.length ?? 0}
          />

          <LogFilters
            search={search}
            onSearchChange={setSearch}
            methodFilter={methodFilter}
            onMethodFilterChange={setMethodFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
          />

          <div
            ref={logContainerRef}
            className="bg-muted/30 flex-1 space-y-2 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
          >
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground text-center">
                {logs.length === 0
                  ? status === 'connected'
                    ? 'Esperando logs...'
                    : 'No hay logs disponibles.'
                  : 'Ningún log coincide con los filtros.'}
              </p>
            ) : (
              filteredLogs.map((log, index) => (
                <LogEntry
                  key={log.timestamp + index + id}
                  log={log}
                  syntaxStyle={syntaxStyle}
                  onDetailClick={setSelectedDetail}
                />
              ))
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex size-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all',
          'bg-primary text-primary-foreground hover:bg-primary-hover',
          isOpen && 'ring-primary/30 ring-2',
        )}
      >
        <Terminal className="size-4" />
      </button>

      <LogDetailDialog
        selectedDetail={selectedDetail}
        syntaxStyle={syntaxStyle}
        onClose={() => setSelectedDetail(null)}
      />
    </div>
  )
}
