import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info, X, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'
import type { EvaluationLogEvent } from '../hooks/useEvaluationWebSocket'

interface FloatingLogsProps {
  logs: EvaluationLogEvent[]
  onClear: () => void
  isFinished?: boolean
}

const levelConfig = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
}

/**
 * FloatingLogs component displays a floating log panel that shows real-time logs related to the evaluation process.
 * It allows users to expand/collapse the log panel and clear the logs.
 *
 * @param {FloatingLogsProps} props - The properties for the FloatingLogs component.
 * @returns {JSX.Element | null} The rendered FloatingLogs component or null if there are no logs.
 */
export function FloatingLogs({ logs, onClear, isFinished }: FloatingLogsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, isExpanded])

  if (logs.length === 0) return null

  return (
    <div className="animate-fade-in fixed right-4 bottom-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-card rounded-lg border shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <h3 className="flex items-center gap-1 text-sm font-medium">
              {!isFinished && <Spinner />}
              Procesamiento
            </h3>

            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {logs.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-accent cursor-pointer rounded p-1 transition-colors"
              aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            <button
              onClick={onClear}
              className="hover:bg-accent cursor-pointer rounded p-1 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div ref={scrollRef} className="max-h-80 space-y-4 overflow-y-auto p-3">
            {logs.map((log, index) => {
              const config = levelConfig[log.level]
              const Icon = config.icon

              return (
                <div
                  key={index}
                  className={cn('animate-fade-in flex items-start gap-2 rounded-md text-sm')}
                >
                  <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0')} />

                  <div className="min-w-0 flex-1">
                    <p className="text-foreground leading-tight">{log.message}</p>

                    {log.teacher_name && (
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        {log.teacher_name}
                        {log.course_name && ` • ${log.course_name}`}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
