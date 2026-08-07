import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info, X, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

/** Severity level of a log entry. */
export type LogLevel = 'info' | 'success' | 'warning' | 'error'

/** A single entry rendered inside a FloatingLogs panel. */
export interface LogEntry {
  /** Stable key used by React for the entry. */
  id: string
  level: LogLevel
  message: string
  /** Optional secondary line rendered under the message. */
  meta?: string
}

interface FloatingLogsProps {
  logs: LogEntry[]
  /** Title shown in the header next to the spinner and count. */
  title?: string
  /** Whether the underlying task has finished; hides the spinner when true. */
  isFinished?: boolean
  /** Initial expanded state. Defaults to true. */
  defaultExpanded?: boolean
  /** Called when the user clicks the close button. */
  onClear?: () => void
  /** Optional footer slot (e.g. a "view details" link) rendered when finished. */
  footer?: ReactNode
  /** Positioning and width overrides for the floating panel. */
  className?: string
}

const levelConfig: Record<LogLevel, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  success: { icon: CheckCircle, color: 'text-green-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  error: { icon: XCircle, color: 'text-red-500' },
}

/**
 * Floating panel that shows a scrollable list of real-time logs while a task
 * runs in the background. Auto-scrolls to the newest entry and can be
 * expanded/collapsed. Renders nothing while the log list is empty.
 *
 * @example
 * <FloatingLogs
 *   logs={[{ id: '1', level: 'success', message: 'Listo' }]}
 *   title="Procesamiento"
 *   isFinished
 *   onClear={() => {}}
 *   footer={<Link href="/detail">Ver detalles</Link>}
 * />
 */
export function FloatingLogs({
  logs,
  title = 'Procesamiento',
  isFinished = false,
  defaultExpanded = true,
  onClear,
  footer,
  className,
}: FloatingLogsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, isExpanded])

  if (logs.length === 0) return null

  return (
    <div className={cn('fixed right-4 bottom-4 z-50 w-96 max-w-[calc(100vw-2rem)]', className)}>
      <div className="bg-card rounded-lg border shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <h3 className="flex items-center gap-1 text-sm font-medium">
              {!isFinished && <Spinner />}
              {title}
            </h3>

            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {logs.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className="hover:bg-accent cursor-pointer rounded p-1 transition-colors"
              aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {onClear && (
              <button
                onClick={onClear}
                className="hover:bg-accent cursor-pointer rounded p-1 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div ref={scrollRef} className="max-h-80 space-y-4 overflow-y-auto p-3">
            {logs.map((log) => {
              const config = levelConfig[log.level]
              const Icon = config.icon

              return (
                <div key={log.id} className="animate-fade-in flex items-start gap-2 text-sm">
                  <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', config.color)} aria-hidden />

                  <div className="min-w-0 flex-1">
                    <p className="text-foreground leading-tight">{log.message}</p>

                    {log.meta && (
                      <p className="text-muted-foreground mt-0.5 text-[10px]">{log.meta}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isFinished && footer && <div className="border-t px-4 py-2">{footer}</div>}
      </div>
    </div>
  )
}
