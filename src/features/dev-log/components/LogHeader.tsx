import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Circle, Terminal, Trash2, X } from 'lucide-react'

import type { ConnectionStatus } from '../hooks/useDevLogWebSocket'

interface LogHeaderProps {
  status: ConnectionStatus
  onClear: () => void
  onClose: () => void
}

export function LogHeader({ status, onClear, onClose }: LogHeaderProps) {
  return (
    <div className="border-border flex items-center justify-between border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <Terminal className="text-muted-foreground size-4" />

        <span className="text-sm font-medium">Logs de Desarrollo</span>

        <Circle
          className={cn(
            'size-2 fill-current',
            status === 'connected' && 'text-green-500',
            status === 'connecting' && 'text-yellow-500',
            (status === 'disconnected' || status === 'error') && 'text-red-500',
          )}
        />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" onClick={onClear} title="Clear logs">
          <Trash2 className="size-3.5" />
        </Button>

        <Button variant="ghost" size="icon-xs" onClick={onClose} title="Close">
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
