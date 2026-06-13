import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import DataTable, {
  type DataTableAction,
  type DataTableCreateConfig,
} from "@/components/common/DataTable";
import useCreatePeriod from "../hooks/useCreatePeriod";
import useGetPeriods from "../hooks/useGetPeriods";
import usePeriodColumns from "../hooks/usePeriodColumns";
import usePeriodStatusActions from "../hooks/usePeriodStatusActions";
import useUpdatePeriod from "../hooks/useUpdatePeriod";
import type { Period } from "../types/Period";
import EditPeriodDialog from "./EditPeriodDialog";

function DataPeriods() {
  const columns = usePeriodColumns();
  const { mutateAsync: updatePeriod, isPending: isSavingPeriod } =
    useUpdatePeriod();
  const createPeriodMutation = useCreatePeriod();

  const [createForm, setCreateForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    evaluation_end_date: "",
    final_evaluation_date: "",
  });

  const createConfig = useMemo<DataTableCreateConfig>(
    () => ({
      label: "Nuevo periodo",
      dialogTitle: "Crear periodo académico",
      dialogDescription: "Complete los datos del nuevo periodo académico.",
      renderForm: ({ close }) => (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createPeriodMutation.mutate(
              {
                name: createForm.name,
                start_date: createForm.start_date,
                end_date: createForm.end_date,
                evaluation_end_date: createForm.evaluation_end_date,
                final_evaluation_date: createForm.final_evaluation_date,
              },
              {
                onSuccess: () => {
                  toast.success("Periodo creado exitosamente");

                  setCreateForm({
                    name: "",
                    start_date: "",
                    end_date: "",
                    evaluation_end_date: "",
                    final_evaluation_date: "",
                  });

                  close();
                },
                onError: () => {
                  toast.error("Error al crear el periodo");
                },
              },
            );
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre</Label>

              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-start_date">Fecha inicio</Label>

              <Input
                id="create-start_date"
                type="date"
                value={createForm.start_date}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-end_date">Fecha cierre</Label>

              <Input
                id="create-end_date"
                type="date"
                value={createForm.end_date}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-evaluation_end_date">
                Cierre evaluación
              </Label>

              <Input
                id="create-evaluation_end_date"
                type="date"
                value={createForm.evaluation_end_date}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    evaluation_end_date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-final_evaluation_date">
                Evaluación final
              </Label>

              <Input
                id="create-final_evaluation_date"
                type="date"
                value={createForm.final_evaluation_date}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    final_evaluation_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>

            <Button type="submit" disabled={createPeriodMutation.isPending}>
              {createPeriodMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      ),
    }),
    [createPeriodMutation, createForm],
  );

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { isTogglingStatus, handleDeactivatePeriod, handleActivatePeriod } =
    usePeriodStatusActions();

  const rowActions = useMemo<DataTableAction<Period>[]>(
    () => [
      {
        label: "Editar",
        onClick: (period) => {
          setEditingPeriod(period);
          setIsDialogOpen(true);
        },
      },
      {
        label: "Activar",
        visible: (period) => !period.active,
        className: "text-emerald-600 focus:text-emerald-700",
        onClick: (period) => handleActivatePeriod(period),
        disabled: () => isTogglingStatus,
      },
      {
        label: "Desactivar",
        variant: "destructive",
        visible: (period) => period.active,
        onClick: (period) => handleDeactivatePeriod(period),
        disabled: () => isTogglingStatus,
      },
    ],
    [handleActivatePeriod, handleDeactivatePeriod, isTogglingStatus],
  );

  const handleSavePeriod = async (data: {
    id: string;
    codigo: string;
    nombre: string;
    start: string;
    end: string;
    evalStart: string;
    evalEnd: string;
  }) => {
    try {
      await updatePeriod(data);
      setIsDialogOpen(false);
      setEditingPeriod(null);
    } catch {
      // error handled by toast in mutation
    }
  };

  return (
    <>
      <DataTable
        columns={columns}
        queryFn={useGetPeriods}
        emptyMessage="No hay periodos académicos para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar periodo..."
        createConfig={createConfig}
      />

      <EditPeriodDialog
        open={isDialogOpen}
        period={editingPeriod}
        isSaving={isSavingPeriod}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingPeriod(null);
        }}
        onSave={handleSavePeriod}
      />
    </>
  );
}

export default DataPeriods;
