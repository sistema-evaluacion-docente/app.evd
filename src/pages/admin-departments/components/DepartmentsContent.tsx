import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFaculties } from "@/features/faculties";
import { PageHeader } from "@/shared/ui";

import DataTable, {
  type DataTableAction,
  type DataTableCreateConfig,
} from "@/components/common/DataTable";
import type { Department } from "@/features/departments";
import {
  getDepartments,
  useCreateDepartment,
  useDepartmentColumns,
  useUpdateDepartment,
} from "@/features/departments";
import EditDepartmentDialog from "./EditDepartmentDialog";

function useGetAllDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function DepartmentsContent() {
  const columns = useDepartmentColumns();
  const createMutation = useCreateDepartment();
  const { mutateAsync: updateDepartment, isPending: isSavingDepartment } =
    useUpdateDepartment();

  const { data: facultiesData } = useQuery({
    queryKey: ["faculties"],
    queryFn: getFaculties,
  });
  const faculties = facultiesData?.data ?? [];

  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    faculty_id: "",
  });

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createConfig = useMemo<DataTableCreateConfig>(
    () => ({
      label: "Nuevo departamento",
      dialogTitle: "Crear departamento",
      dialogDescription: "Complete los datos del nuevo departamento.",
      renderForm: ({ close }) => (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(
              {
                name: createForm.name,
                code: createForm.code || undefined,
                faculty_id: createForm.faculty_id
                  ? Number(createForm.faculty_id)
                  : undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Departamento creado exitosamente");
                  setCreateForm({ name: "", code: "", faculty_id: "" });
                  close();
                },
                onError: () => {
                  toast.error("Error al crear el departamento");
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
                placeholder="Nombre del departamento"
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
                placeholder="Código opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Facultad</Label>
              <Select
                value={createForm.faculty_id}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    faculty_id: value ?? "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar facultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin facultad</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    [createMutation, createForm, faculties],
  );

  const rowActions = useMemo<DataTableAction<Department>[]>(
    () => [
      {
        label: "Editar",
        onClick: (department) => {
          setEditingDepartment(department);
          setIsEditDialogOpen(true);
        },
      },
      {
        label: "Activar",
        visible: (department) => !department.active,
        className: "text-emerald-600 focus:text-emerald-700",
        onClick: (department) =>
          updateDepartment({ id: department.id, active: true }),
        disabled: () => isSavingDepartment,
      },
      {
        label: "Desactivar",
        variant: "destructive",
        visible: (department) => department.active,
        onClick: (department) =>
          updateDepartment({ id: department.id, active: false }),
        disabled: () => isSavingDepartment,
      },
    ],
    [updateDepartment, isSavingDepartment],
  );

  const handleSaveDepartment = async (data: {
    id: number;
    name: string;
    code?: string;
    faculty_id?: number;
  }) => {
    try {
      await updateDepartment(data);
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
    } catch {
      // error handled by toast in mutation
    }
  };

  return (
    <>
      <PageHeader
        title="Departamentos"
        description="Gestione los departamentos académicos."
      />

      <DataTable
        columns={columns}
        queryFn={useGetAllDepartments}
        emptyMessage="No hay departamentos para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar departamento..."
        createConfig={createConfig}
      />

      {editingDepartment && (
        <EditDepartmentDialog
          open={isEditDialogOpen}
          department={editingDepartment}
          isSaving={isSavingDepartment}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingDepartment(null);
          }}
          onSave={handleSaveDepartment}
        />
      )}
    </>
  );
}
