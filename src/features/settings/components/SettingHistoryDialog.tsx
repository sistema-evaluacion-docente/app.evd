import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";

import useGetSettingHistory from "../hooks/useGetSettingHistory";
import type { Setting } from "../types/Setting";
import formatDate from "@/lib/formatDate";

interface SettingHistoryDialogProps {
  open: boolean;
  setting: Setting | null;
  onOpenChange: (open: boolean) => void;
}

function SettingHistoryDialog({
  open,
  setting,
  onOpenChange,
}: SettingHistoryDialogProps) {
  const { data, isLoading } = useGetSettingHistory({
    settingId: setting?.id ?? null,
    page: 1,
    limit: 50,
  });

  const history = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de cambios</DialogTitle>

          <DialogDescription>
            {setting
              ? `Registro de modificaciones para: ${setting.key}`
              : "Seleccione una configuración para ver su historial."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay cambios registrados.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Fecha
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Valor anterior
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Valor nuevo
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Motivo
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {formatDate(entry.changed_at)}
                    </td>

                    <td className="px-4 py-3 text-xs font-mono max-w-40 truncate">
                      {entry.old_value ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-xs font-mono max-w-40 truncate font-medium">
                      {entry.new_value}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate">
                      {entry.change_reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SettingHistoryDialog;
