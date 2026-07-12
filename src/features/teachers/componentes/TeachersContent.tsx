import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

import DataTable from "@/components/common/DataTable";
import { PageHeader } from "@/shared/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useGetTeachers from "../hooks/useGetTeachers";
import useDeleteTeacher from "../hooks/useDeleteTeacher";
import type { Teacher } from "../types/Teacher";
import CreateTeacherDrawer from "./CreateTeacherDrawer";
import EditTeacherDrawer from "./EditTeacherDrawer";

const columns: ColumnDef<Teacher>[] = [
  {
    header: "Nombre",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link href={`/teachers/${row.original?.id}`}>
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

          <span className="font-medium">
            {row.original?.user?.name}
          </span>
        </div>
      </Link>
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteTeacher = useDeleteTeacher();

  const handleDeleteConfirm = () => {
    if (!deletingTeacher) return;

    deleteTeacher.mutate(deletingTeacher.id, {
      onSuccess: () => {
        setDeletingTeacher(null);
        setIsDeleteDialogOpen(false);
      },
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestión de Docentes"
        description="Listado de docentes registrados en el sistema."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/teachers/upload">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDrawerOpen(true)}
              >
                <Plus size={14} strokeWidth={2.25} />
                Cargar docentes
              </Button>
            </Link>

            <Button type="button" onClick={() => setIsDrawerOpen(true)}>
              <Plus size={14} strokeWidth={2.25} />
              Nuevo docente
            </Button>
          </div>
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
            label: "Editar",
            onClick: (row) => {
              setEditingTeacher(row);
              setIsEditDrawerOpen(true);
            },
          },
          {
            label: "Ver detalle",
            onClick: (row) => navigate(`/teachers/${row.id}`),
          },
          {
            label: "Eliminar",
            variant: "destructive",
            onClick: (row) => {
              setDeletingTeacher(row);
              setIsDeleteDialogOpen(true);
            },
          },
        ]}
        actionsHeaderLabel="Acciones"
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeletingTeacher(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar docente</AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                ¿Estás seguro de que deseas eliminarlo? Esta acción no se puede
                deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTeacher.isPending}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTeacher.isPending}
            >
              {deleteTeacher.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateTeacherDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

      {editingTeacher && (
        <EditTeacherDrawer
          key={editingTeacher.id}
          open={isEditDrawerOpen}
          teacher={editingTeacher}
          onOpenChange={(open) => {
            setIsEditDrawerOpen(open);
            if (!open) setEditingTeacher(null);
          }}
        />
      )}
    </div>
  );
}

export default TeachersContent;
