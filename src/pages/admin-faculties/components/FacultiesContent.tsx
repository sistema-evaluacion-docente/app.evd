import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/shared/ui";
import { useQuery } from "@tanstack/react-query";

import DataTable, {
  type DataTableAction,
  type DataTableCreateConfig,
} from "@/components/common/DataTable";
import type { Faculty } from "@/features/faculties";
import {
  getFaculties,
  useCreateFaculty,
  useFacultyColumns,
  useUpdateFaculty,
} from "@/features/faculties";
import EditFacultyDialog from "./EditFacultyDialog";

function useGetAllFaculties({ page, limit, search }: {
  page: number,
  limit: number,
  search: string
}) {
  return useQuery({
    queryKey: ["faculties", page, limit, search],
    queryFn: () => getFaculties({ page, limit, search }),
  });
}

export function FacultiesContent() {
  const columns = useFacultyColumns();
  const createMutation = useCreateFaculty();
  const { mutateAsync: updateFaculty, isPending: isSavingFaculty } =
    useUpdateFaculty();

  const [createForm, setCreateForm] = useState({ name: "", code: "" });

  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createConfig = useMemo<DataTableCreateConfig>(
    () => ({
      label: "Nueva facultad",
      dialogTitle: "Crear facultad",
      dialogDescription: "Complete los datos de la nueva facultad.",
      renderForm: ({ close }) => (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(
              {
                name: createForm.name,
                code: createForm.code || undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Facultad creada exitosamente");
                  setCreateForm({ name: "", code: "" });
                  close();
                },
                onError: () => {
                  toast.error("Error al crear la facultad");
                },
              },
            );
          }}
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre</Label>

              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nombre de la facultad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-code">Código</Label>

              <Input
                id="create-code"
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="Código"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={!createForm.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      ),
    }),
    [createMutation, createForm],
  );

  const rowActions = useMemo<DataTableAction<Faculty>[]>(
    () => [
      {
        label: "Editar",
        onClick: (faculty) => {
          setEditingFaculty(faculty);
          setIsEditDialogOpen(true);
        },
      },
      {
        label: "Activar",
        visible: (faculty) => !faculty.active,
        className: "text-emerald-600 focus:text-emerald-700",
        onClick: (faculty) => updateFaculty({ id: faculty.id, active: true }),
        disabled: () => isSavingFaculty,
      },
      {
        label: "Desactivar",
        variant: "destructive",
        visible: (faculty) => faculty.active,
        onClick: (faculty) => updateFaculty({ id: faculty.id, active: false }),
        disabled: () => isSavingFaculty,
      },
    ],
    [updateFaculty, isSavingFaculty],
  );

  const handleSaveFaculty = async (data: {
    id: number;
    name: string;
    code?: string;
  }) => {
    try {
      await updateFaculty(data);
      setIsEditDialogOpen(false);
      setEditingFaculty(null);
    } catch {
      // error handled by toast in mutation
    }
  };

  return (
    <>
      <PageHeader
        title="Facultades"
        description="Gestione las facultades académicas."
      />

      <DataTable
        columns={columns}
        queryFn={useGetAllFaculties}
        emptyMessage="No hay facultades para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar facultad..."
        createConfig={createConfig}
      />

      <EditFacultyDialog
        open={isEditDialogOpen}
        faculty={editingFaculty}
        isSaving={isSavingFaculty}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingFaculty(null);
        }}
        onSave={handleSaveFaculty}
      />
    </>
  );
}
