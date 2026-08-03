import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { Link } from 'wouter'

export default function TeacherNoEvaluationState() {
  return (
    <Card className="p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-xl">
          <FileText size={24} className="text-muted-foreground" />
        </div>

        <div>
          <p className="text-[15px] font-semibold">Sin evaluación disponible</p>

          <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
            Este docente no cuenta con evaluación docente disponible.
          </p>

          <Link href="/teachers">Volver</Link>
        </div>
      </div>
    </Card>
  )
}
