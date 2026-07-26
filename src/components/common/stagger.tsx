import { cn } from '@/lib/utils'

export interface StaggerProps {
  children: React.ReactNode
  delay?: number
  animation?: string
  className?: string
}

export function Stagger({
  children,
  delay = 0,
  animation = 'animate-fade-in',
  className,
}: StaggerProps) {
  return (
    <div
      className={cn(animation, className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}
