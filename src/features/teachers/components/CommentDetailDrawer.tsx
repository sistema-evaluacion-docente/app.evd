import { Pencil, Sparkles, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { PercentMeter } from '@/components/common/PercentMeter'
import { Stagger } from '@/components/common/stagger'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useAuthStore } from '@/features/auth'
import formatDate from '@/lib/formatDate'
import type { TeacherComment } from '../types'
import { CategoryTag } from './CategoryTag'
import { CommentClassificationForm } from './CommentClassificationForm'

export interface CommentDetailDrawerProps {
  comment: TeacherComment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Side drawer with everything known about a single comment: the verbatim text
 * unclipped, its risk level and pedagogical categories with the model's
 * confidence, where it came from (teacher, materia, grupo) and how it was
 * classified (models, analysis date, director corrections). Directors also get
 * `CommentClassificationForm` inline to correct the classification without
 * leaving the drawer.
 *
 * Receives the comment through props and never fetches — the list that opened
 * it already holds the record, and `useUpdateComment` refreshes that list.
 *
 * @example
 * <CommentDetailDrawer comment={comment} open={open} onOpenChange={setOpen} />
 */
export function CommentDetailDrawer({ comment, open, onOpenChange }: CommentDetailDrawerProps) {
  const isDirector = useAuthStore((state) => state.selectedRole) === 'DIRECTOR DE DEPARTAMENTO'
  const accent = comment.risk_level?.color_hex

  const riskEdited = comment.risk_level_modified_by_director === true
  const categoryEdited = comment.pedagogical_category_modified_by_director === true
  const wasEdited = riskEdited || categoryEdited

  const editedWhat =
    riskEdited && categoryEdited
      ? 'Nivel de riesgo y categoría'
      : riskEdited
        ? 'Nivel de riesgo'
        : 'Categoría pedagógica'

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right" showSwipeHandle>
      <DrawerContent className="h-full w-full sm:mr-0 sm:ml-auto sm:max-w-xl sm:rounded-l-xl sm:rounded-r-none md:max-w-lg">
        <DrawerHeader className="relative">
          <DrawerClose>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 size-8 rounded-full"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </Button>
          </DrawerClose>

          <DrawerTitle className="pr-8 text-left">Detalle del comentario</DrawerTitle>

          <DrawerDescription className="text-left">
            {comment.course_name} · Grupo {comment.group_name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {comment.teacher_name && (
            <Stagger animation="animate-rise" className="flex items-center gap-2.5">
              <Avatar size="lg">
                <AvatarFallback>{comment.teacher_name.at(0)}</AvatarFallback>

                <AvatarImage
                  src={comment.teacher_avatar_url}
                  alt={`Foto de ${comment.teacher_name}`}
                />
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{comment.teacher_name}</p>

                <p className="text-muted-foreground text-xs tracking-wide uppercase">Docente</p>
              </div>
            </Stagger>
          )}

          <Stagger animation="animate-rise" delay={50}>
            <figure
              className="border-l-2 pl-4"
              style={accent ? { borderColor: accent } : undefined}
            >
              <blockquote className="text-foreground/90 text-base leading-relaxed whitespace-pre-line">
                {comment.original_text}
              </blockquote>

              <figcaption className="text-muted-foreground mt-2 text-xs">
                Texto original escrito por el estudiante
              </figcaption>
            </figure>
          </Stagger>

          <Section title="Clasificación" delay={100}>
            <dl className="divide-border/70 divide-y">
              <Row label="Nivel de riesgo">
                {comment.risk_level ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        accent
                          ? {
                              color: `color-mix(in srgb, ${accent} 60%, var(--color-foreground))`,
                              backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      {comment.risk_level.name}
                    </span>

                    <PercentMeter
                      value={comment.risk_score}
                      label={`Probabilidad de acierto del nivel de riesgo ${comment.risk_level.name}`}
                      color={accent}
                      showBar={false}
                    />
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin clasificar</span>
                )}
              </Row>

              <Row label="Categorías pedagógicas">
                {comment.pedagogical_categories.length > 0 ? (
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {comment.pedagogical_categories.map((category) => (
                      <CategoryTag
                        key={category.id}
                        category={category}
                        variant="soft"
                        score={category.score}
                        showScoreBar={false}
                      />
                    ))}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin clasificar</span>
                )}
              </Row>
            </dl>
          </Section>

          <Section title="Detalles del análisis" delay={150}>
            <dl className="divide-border/70 divide-y">
              <Row label="Modelo · nivel de riesgo" icon={<Sparkles className="size-3" />}>
                <Value>{comment.risk_level_ai_model}</Value>
              </Row>

              <Row label="Modelo · categoría" icon={<Sparkles className="size-3" />}>
                <Value>{comment.pedagogical_category_ai_model}</Value>
              </Row>

              <Row label="Analizado">
                <Value>{formatDate(comment.created_at)}</Value>
              </Row>

              {wasEdited ? (
                <>
                  <Row label="Editado por el director" icon={<Pencil className="size-3" />}>
                    <Value>{editedWhat}</Value>
                  </Row>

                  <Row label="Última modificación">
                    <Value>{formatDate(comment.updated_at)}</Value>
                  </Row>
                </>
              ) : (
                <Row label="Editado por el director">
                  <Value>No</Value>
                </Row>
              )}
            </dl>
          </Section>

          {isDirector && (
            <Section title="Corregir clasificación" delay={200}>
              <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                La clasificación automática es una ayuda, no un veredicto. Ajústala si el texto dice
                otra cosa.
              </p>

              {open && (
                <CommentClassificationForm comment={comment} onSaved={() => onOpenChange(false)} />
              )}
            </Section>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * One titled block of the drawer body, eased in with a small delay so the
 * sections arrive in order as the panel finishes sliding rather than all at
 * once. `Stagger` owns the animation and the delay.
 */
function Section({
  title,
  delay = 0,
  children,
}: {
  title: string
  delay?: number
  children: ReactNode
}) {
  return (
    <Stagger animation="animate-rise" delay={delay}>
      <section>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          {title}
        </h3>

        {children}
      </section>
    </Stagger>
  )
}

function Row({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
        {icon}
        {label}
      </dt>

      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

function Value({ children }: { children?: string | null }) {
  return <span className="text-xs font-medium wrap-break-word">{children || '—'}</span>
}
