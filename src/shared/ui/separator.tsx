import { cn } from '@/shared/lib/utils'

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-ink-200', className)} />
}
