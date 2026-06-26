import { useMemo, useState } from "react";
import { toast } from "sonner";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import useGetSettings from "../hooks/useGetSettings";
import useSettingColumns from "../hooks/useSettingColumns";
import useUpdateSetting from "../hooks/useUpdateSetting";
import type { Setting } from "../types/Setting";
import EditSettingDrawer from "./EditSettingDrawer";
import SettingHistoryDialog from "./SettingHistoryDialog";

function DataSettings() {
  const columns = useSettingColumns();
  const { mutateAsync: updateSetting, isPending: isSavingSetting } =
    useUpdateSetting();

  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [historySetting, setHistorySetting] = useState<Setting | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const rowActions = useMemo<DataTableAction<Setting>[]>(
    () => [
      {
        label: "Editar",
        onClick: (setting) => {
          setEditingSetting(setting);
          setIsDrawerOpen(true);
        },
      },
      {
        label: "Historial",
        onClick: (setting) => {
          setHistorySetting(setting);
          setIsHistoryOpen(true);
        },
      },
    ],
    [],
  );

  const handleSaveSetting = async (data: {
    id: number;
    value: string;
    change_reason?: string;
  }) => {
    try {
      await updateSetting(data);
      setIsDrawerOpen(false);
      setEditingSetting(null);
      toast.success("Configuración actualizada exitosamente");
    } catch {
      toast.error("Error al actualizar la configuración");
    }
  };

  return (
    <>
      <DataTable
        columns={columns}
        queryFn={useGetSettings}
        emptyMessage="No hay configuraciones para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar configuración..."
      />

      <EditSettingDrawer
        open={isDrawerOpen}
        setting={editingSetting}
        isSaving={isSavingSetting}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setEditingSetting(null);
        }}
        onSave={handleSaveSetting}
      />

      <SettingHistoryDialog
        open={isHistoryOpen}
        setting={historySetting}
        onOpenChange={(open) => {
          setIsHistoryOpen(open);
          if (!open) setHistorySetting(null);
        }}
      />
    </>
  );
}

export default DataSettings;
