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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Save, Undo2, UserRoundSearch } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDebounce } from 'use-debounce'

import type { User } from '@/features/auth/types/User'
import type { Department } from '@/features/departments'
import getAllUsers from '@/features/users/api/getAllUsers'

interface AssignDirectorDrawerProps {
  open: boolean
  department: Department | null
  onOpenChange: (open: boolean) => void
  onAssign: (data: { departmentId: number; userId: number }) => Promise<unknown>
  isSaving: boolean
}

function AssignDirectorDrawer({
  open,
  department,
  onOpenChange,
  onAssign,
  isSaving,
}: AssignDirectorDrawerProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'director-search', debouncedSearch],
    queryFn: () => getAllUsers({ page: 1, limit: 20, search: debouncedSearch }),
    enabled: open,
  })

  const users = usersData?.data ?? []

  const handleSelect = useCallback((user: User) => {
    setSelectedUser((prev) => (prev?.id === user.id ? null : user))
  }, [])

  const handleSubmit = async () => {
    if (!department || !selectedUser) return

    await onAssign({ departmentId: department.id, userId: selectedUser.id! })

    handleClose()
  }

  const handleClose = () => {
    onOpenChange(false)
    setSearch('')
    setSelectedUser(null)
  }

  return (
    <Drawer open={open} onOpenChange={handleClose} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>Asignar director</DrawerTitle>

          <DrawerDescription>
            Busca y selecciona el usuario que será director del departamento{' '}
            <span className="text-foreground font-medium">{department?.name}</span>.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label>Director actual</Label>

            {department?.director ? (
              <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                <Avatar>
                  <AvatarImage src={department.director.avatar_url} />
                  <AvatarFallback>{department.director.name?.slice(0, 2)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="text-sm font-medium">{department.director.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                <Avatar className="opacity-50">
                  <AvatarFallback>
                    <UserRoundSearch className="text-muted-foreground size-4" />
                  </AvatarFallback>
                </Avatar>

                <p className="text-muted-foreground text-sm">Sin director asignado</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nuevo director</Label>

            <div className="relative">
              <UserRoundSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario por nombre o email..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="size-8 rounded-full" />

                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No se encontraron usuarios.
              </p>
            ) : (
              <ul className="divide-y">
                {users.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(user)}
                      className={cn(
                        'hover:bg-muted/50 flex w-full items-center gap-3 p-3 text-left transition-colors',
                        selectedUser?.id === user.id && 'bg-primary/10',
                      )}
                    >
                      <Avatar size="sm">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>

                        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                      </div>

                      {selectedUser?.id === user.id && (
                        <span className="text-primary shrink-0 text-xs font-medium">
                          Seleccionado
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DrawerFooter className="px-4 pb-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            <Undo2 />
            Cancelar
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={!selectedUser || isSaving}>
            <Save />
            {isSaving ? 'Asignando...' : 'Asignar director'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default AssignDirectorDrawer
