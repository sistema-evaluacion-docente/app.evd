import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

import type { LogEntry as LogEntryType } from '../hooks/useDevLogWebSocket'
import { parseLogMessage } from '../hooks/useLogFilter'

type SyntaxStyle = Record<string, CSSProperties>

interface LogEntryProps {
  log: LogEntryType
  syntaxStyle: SyntaxStyle
  onDetailClick: (detail: string) => void
}

/**
 * LogEntry component displays a single log entry with its metadata and message.
 *
 * @param log - The log entry to display.
 * @param syntaxStyle - The syntax highlighting style to use for displaying the log message.
 * @param onDetailClick - Callback function to handle clicking on the "Ver detalle" button.
 */
export function LogEntry({ log, syntaxStyle, onDetailClick }: LogEntryProps) {
  const parsed = parseLogMessage(log.message)

  const { meta } = parsed

  return (
    <div className="flex gap-2 py-1">
      <span className="text-muted-foreground/60 shrink-0 pt-0.5">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          {meta.category && (
            <span
              className={cn(
                'inline-block rounded px-1 py-0.5 text-[10px] leading-none font-medium uppercase',
                meta.category === 'request' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                meta.category === 'response' &&
                  'bg-green-500/10 text-green-600 dark:text-green-400',
                meta.category === 'db_write' &&
                  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              )}
            >
              {meta.category}
            </span>
          )}

          {meta.method && (
            <span className="text-muted-foreground text-[10px] font-semibold">{meta.method}</span>
          )}

          {meta.statusCode && (
            <span
              className={cn(
                'text-[10px] font-medium',
                meta.statusCode < 300
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {meta.statusCode}
            </span>
          )}

          {meta.path && (
            <span className="text-muted-foreground truncate text-[10px]">{meta.path}</span>
          )}
        </div>

        {parsed.text && (
          <SyntaxHighlighter
            language="json"
            style={syntaxStyle}
            customStyle={{
              margin: 0,
              padding: '4px 8px',
              fontSize: 'inherit',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              lineHeight: '1.5',
            }}
          >
            {parsed.text}
          </SyntaxHighlighter>
        )}

        {parsed.detail && (
          <Button size="xs" onClick={() => onDetailClick(parsed.detail!)} className="mt-1">
            Ver detalle
          </Button>
        )}
      </div>
    </div>
  )
}
