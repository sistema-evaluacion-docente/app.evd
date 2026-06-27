import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

import DataTable from "@/components/common/DataTable";
import { PageHeader } from "@/shared/ui";
import useGetTeachers from "../hooks/useGetTeachers";
import type { Teacher } from "../types/Teacher";

const columns: ColumnDef<Teacher>[] = [
  {
    header: "Nombre",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>
            {row.original?.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>

          <AvatarImage
            alt={row.original?.user?.name}
            src={row.original?.user?.avatar_url}
          />
        </Avatar>

        <span className="font-medium text-ink-900">
          {row.original?.user?.name}
        </span>
      </div>
    ),
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original?.user?.email}</span>
    ),
  },
  {
    header: "Código",
    accessorKey: "institutional_code",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.institutional_code}
      </span>
    ),
  },
  {
    header: "Estado",
    accessorKey: "active",
    cell: ({ row }) => {
      const active = row.original.active;
      return (
        <Badge
          variant={active ? "default" : "secondary"}
          className={cn(
            "text-[11px] font-semibold uppercase",
            active
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-ink-100 text-ink-600",
          )}
        >
          {active ? "Activo" : "Inactivo"}
        </Badge>
      );
    },
  },
];

function TeachersContent() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestión de Docentes"
        description="Listado de docentes registrados en el sistema."
        actions={
          <Link
            href="/upload-teachers"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={14} strokeWidth={2.25} />
            Cargar docentes
          </Link>
        }
      />

      <DataTable
        columns={columns}
        queryFn={useGetTeachers}
        searchPlaceholder="Buscar por nombre, email o usuario..."
        emptyMessage="No se encontraron docentes."
        pageSize={10}
        rowActions={[
          {
            label: "Ver detalle",
            onClick: (row) => navigate(`/teachers/${row.uid}`),
          },
        ]}
        actionsHeaderLabel="Acciones"
      />
    </div>
  );
}

export default TeachersContent;
