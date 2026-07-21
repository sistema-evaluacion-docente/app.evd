import { Card } from '@/components/ui/card'

export function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex min-h-56 items-center justify-center p-8 text-center">
      <div className="text-muted-foreground text-sm">{children}</div>
    </Card>
  )
}
