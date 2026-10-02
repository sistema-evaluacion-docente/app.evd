import { Link } from 'wouter'

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { AUTHORS } from '@/features/about'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const SHORT_NAMES = AUTHORS.map((author) => author.shortName)
// "A, B" en una línea y "y C" en la siguiente, para que ningún nombre quede truncado.
const LEADING_NAMES = SHORT_NAMES.slice(0, -1).join(', ')
const LAST_NAME = SHORT_NAMES.at(-1)
const NAMES = LEADING_NAMES ? `${LEADING_NAMES} y ${LAST_NAME}` : (LAST_NAME ?? '')

/** Crédito discreto a los autores en el pie del sidebar; lleva a la sección Autores. */
export function DevelopedBy() {
  return (
    <Link
      href="/#autores"
      title={`Desarrollado por ${NAMES}`}
      className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-2.5 rounded-md p-2 transition-colors"
    >
      <AvatarGroup className="shrink-0">
        {AUTHORS.map((author) => (
          <Avatar key={author.code} size="sm" className="ring-sidebar!">
            <AvatarImage src={author.photo} alt={author.shortName} />
            <AvatarFallback className="text-[10px]">{initials(author.shortName)}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>

      <span className="min-w-0 text-[11px] leading-tight">
        Desarrollado por
        {LEADING_NAMES && <span className="block truncate">{LEADING_NAMES}</span>}
        <span className="block truncate">{LEADING_NAMES ? `y ${LAST_NAME}` : LAST_NAME}</span>
      </span>
    </Link>
  )
}
