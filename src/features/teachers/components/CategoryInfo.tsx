import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CATEGORIES } from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import { COMMENT_ACTION_TRIGGER } from './commentActionStyles'

export interface CategoryInfoProps {
  /** Popover side relative to the trigger. Defaults to `bottom`. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * Help affordance next to the comments: an info button that explains which AI
 * models classify the comments (DistilBETO for risk, RoBERTuito for the
 * pedagogical category), what each category covers, how to read the
 * percentages, where the models fail — and, explicitly, that the automatic
 * classification is an aid for reading, not a verdict: the decision belongs to
 * the department director.
 *
 * @example
 * <CategoryInfo />
 *
 * @example
 * <CategoryInfo side="left" align="start" />
 */
export function CategoryInfo({ side = 'bottom', align = 'start', className }: CategoryInfoProps) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(COMMENT_ACTION_TRIGGER, className)}
        aria-label="Cómo se analizan los comentarios"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        className="w-80 gap-0 p-0 sm:w-[26rem] md:w-[32rem] lg:w-[36rem]"
        aria-label="Cómo se analizan los comentarios"
      >
        <ScrollArea className="h-[60vh]">
          <div className="border-border border-b px-4 py-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Cómo se analizan los comentarios
            </p>

            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              Los comentarios que escriben los estudiantes se procesan con dos modelos de lenguaje
              entrenados en español. Ninguno lee notas, ni promedios, ni sabe quién es el docente:
              solo leen el texto del comentario y proponen una lectura de él.
            </p>
          </div>

          <Section title="Los dos modelos">
            <ModelCard name="DistilBETO" task="Nivel de riesgo" color="var(--color-chart-1)" />
            <ModelCard name="RoBERTuito" task="Categoría pedagógica" color="var(--color-chart-3)" />
          </Section>

          <Section title="Qué significan los porcentajes">
            <p className="text-muted-foreground text-xs leading-relaxed">
              El porcentaje <span className="text-foreground font-medium">no mide la gravedad</span>{' '}
              del comentario: es la probabilidad de acierto que el propio modelo le asigna a la
              etiqueta que eligió.
            </p>

            <div className="mt-2.5">
              <p className="text-muted-foreground text-xs leading-relaxed">
                <span className="num text-foreground font-medium">Riesgo alto 92%</span> no es un
                riesgo mayor que{' '}
                <span className="num text-foreground font-medium">Riesgo alto 61%</span>. Los dos
                comentarios están marcados igual; en el segundo el modelo simplemente está mucho
                menos seguro de haber acertado.
              </p>
            </div>
          </Section>

          <Section title="Las categorías">
            <ul className="divide-border/70 divide-y">
              {CATEGORIES.map((category) => (
                <li key={category.code} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.label}
                  </p>

                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {category.description}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </ScrollArea>

        <div className="border-brand-500/60 bg-brand-50/60 dark:bg-brand-900/15 border-t-2 px-4 py-3">
          <p className="text-foreground/90 text-xs leading-relaxed">
            Por eso esta clasificación es una <span className="font-semibold">ayuda</span>, no un
            veredicto sobre el docente. El texto original siempre manda sobre la etiqueta, y la
            valoración final la hace el{' '}
            <span className="font-semibold">director del departamento</span>.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-border border-b px-4 py-3 last:border-b-0">
      <p className="text-muted-foreground/70 mb-2 text-xs font-medium tracking-wide uppercase">
        {title}
      </p>

      {children}
    </div>
  )
}

function ModelCard({ name, task, color }: { name: string; task: string; color: string }) {
  return (
    <div className="border-border/70 mb-3 last:mb-0" style={{ borderColor: color }}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="num text-sm font-semibold">{name}</span>
        <span className="text-muted-foreground text-xs tracking-wide uppercase">{task}</span>
      </p>
    </div>
  )
}
