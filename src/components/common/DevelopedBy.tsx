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

const NAMES = AUTHORS.map((author) => author.shortName).join(', ')

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
        <span className="block truncate">{NAMES}</span>
      </span>
    </Link>
  )
}
