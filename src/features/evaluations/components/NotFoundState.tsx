import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { Link } from 'wouter'

export function NotFoundState() {
  return (
    <Card className="p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-ink-100 flex h-14 w-14 items-center justify-center rounded-xl">
          <FileText size={24} className="text-ink-400" />
        </div>
        <div>
          <p className="text-ink-800 text-[15px] font-semibold">Evaluación no encontrada</p>

          <p className="text-ink-500 mt-1.5 max-w-sm text-[13px]">
            La evaluación solicitada no existe o no está disponible.
          </p>
        </div>

        <Link href="/evaluations">
          <button className="bg-primary text-primary-foreground hover:bg-primary-hover mt-2 rounded-md px-4 py-2 text-[13px] font-semibold">
            Volver a Evaluaciones
          </button>
        </Link>
      </div>
    </Card>
  )
}
