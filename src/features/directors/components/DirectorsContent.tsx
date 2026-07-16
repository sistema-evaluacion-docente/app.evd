import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import DataTable from '@/components/common/DataTable'
import useGetDirectors from '../hooks/useGetDirectors'
import type { Director } from '../types/Director'
import CreateDirectorDrawer from './CreateDirectorDrawer'

function DirectorsContent() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const columns: ColumnDef<Director>[] = [
    {
      header: 'Director',
      accessorKey: 'user',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{row.original?.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            <AvatarImage alt={row.original?.user?.name} src={row.original?.user?.avatar_url} />
          </Avatar>

          <span className="font-medium">{row.original?.user?.name}</span>
        </div>
      ),
    },
    {
      header: 'Departamento',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original?.department?.name ?? '—'}</span>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'active',
      cell: ({ row }) => {
        const active = row.original.active

        return (
          <Badge
            variant={active ? 'default' : 'secondary'}
            className={cn(
              'text-[11px] font-semibold uppercase',
              active
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-ink-100 text-ink-600',
            )}
          >
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Directores" />

      <DataTable
        columns={columns}
        queryFn={useGetDirectors}
        searchPlaceholder="Buscar por nombre o email..."
        emptyMessage="No se encontraron directores."
        pageSize={10}
        filters={
          <Button type="button" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={14} strokeWidth={2.25} />
            Nuevo director
          </Button>
        }
      />

      <CreateDirectorDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  )
}

export default DirectorsContent
