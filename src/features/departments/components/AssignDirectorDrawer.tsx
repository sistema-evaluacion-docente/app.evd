import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Inbox,
  Search,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetUsers } from '@/features/users'
import { cn } from '@/lib/utils'
import { useAssignDirector } from '../api'
import type { Department } from '../types'

interface AssignDirectorDrawerProps {
  /** Department to assign a director to. Pass null to close the drawer. */
  department: Department | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Drawer that lists active users with a director-eligible role (`DOCENTE` or
 * `DIRECTOR DE DEPARTAMENTO`) — searchable and paginated — so the user can pick
 * one and assign them as director of the selected department.
 *
 * @example
 * <AssignDirectorDrawer department={department} open onOpenChange={setOpen} />
 */
export function AssignDirectorDrawer({
  department,
  open,
  onOpenChange,
}: AssignDirectorDrawerProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const { data, isPending, isError } = useGetUsers({
    page,
    limit: 5,
    search: debouncedSearch,
    active: true,
    roles: ['DOCENTE', 'DIRECTOR DE DEPARTAMENTO'],
  })
  const { mutate: assignDirector, isPending: isAssigning } = useAssignDirector()

  const users = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleAssign = () => {
    if (!department || selectedUserId == null) return

    assignDirector(
      { departmentId: department.id, userId: selectedUserId },
      {
        onSuccess: () => {
          toast.success('Director asignado exitosamente')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>Asignar director</DrawerTitle>

          <DrawerDescription>
            {department
              ? `Selecciona un director para el departamento ${department.name}.`
              : 'Selecciona un director para el departamento.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="relative mb-3">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />

            <Input
              type="text"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por nombre, correo o código..."
              aria-label="Buscar usuario"
              className="bg-background h-9 w-full pl-9 shadow-none"
            />
          </div>

          <div className="space-y-2">
            {isPending ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border-border/40 flex items-center gap-3 rounded-lg border p-3"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ))
            ) : isError ? (
              <div className="text-muted-foreground py-8 text-center">
                <TriangleAlert
                  aria-hidden="true"
                  className="text-destructive/60 mx-auto mb-3 size-8"
                />

                <p className="text-sm">Error al cargar los usuarios.</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <Inbox
                  aria-hidden="true"
                  className="text-muted-foreground/40 mx-auto mb-3 size-8"
                />
                <p className="text-sm">No hay usuarios que coincidan.</p>
              </div>
            ) : (
              users.map((user) => {
                const selected = user.id === selectedUserId

                return (
                  <button
                    key={user.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      selected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/40 hover:bg-muted',
                    )}
                  >
                    <Avatar className="border-border/70 size-9 shrink-0 border">
                      <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />

                      <AvatarFallback>
                        <span className="text-xs font-semibold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </span>
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-semibold">{user.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-muted-foreground text-xs">
                        {user.institutional_code}
                      </span>

                      <span className="text-muted-foreground/70 text-xs">
                        {user.department_name}
                      </span>
                    </div>

                    {selected ? (
                      <Check aria-hidden="true" className="text-primary size-5 shrink-0" />
                    ) : (
                      <Circle
                        aria-hidden="true"
                        className="text-muted-foreground/30 size-5 shrink-0"
                      />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {!isPending && !isError && users.length > 0 ? (
            <div className="mt-3 flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>

              <span aria-live="polite" className="min-w-16 text-center text-sm tabular-nums">
                Página {page} de {pageCount}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={page >= pageCount}
                aria-label="Página siguiente"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <DrawerFooter className="border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleAssign}
            disabled={selectedUserId == null || isAssigning}
          >
            <UserPlus aria-hidden="true" />
            {isAssigning ? 'Asignando...' : 'Asignar director'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
