import FormDrawer from "@/components/common/FormDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Period } from "../types/Period";

interface EditPeriodDialogProps {
  open: boolean;
  period: Period | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    evaluation_end_date: string;
    final_evaluation_date: string;
  }) => void;
}

function EditPeriodDialog({
  open,
  period,
  isSaving,
  onOpenChange,
  onSave,
}: EditPeriodDialogProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!period) return;

    const formData = new FormData(event.currentTarget);

    onSave({
      id: period.id,
      name: String(formData.get("name") ?? ""),
      start_date: String(formData.get("start_date") ?? ""),
      end_date: String(formData.get("end_date") ?? ""),
      evaluation_end_date: String(formData.get("evaluation_end_date") ?? ""),
      final_evaluation_date: String(
        formData.get("final_evaluation_date") ?? "",
      ),
    });
  };

  return (
    <FormDrawer
      key={`${period?.id ?? "period"}-${open ? "open" : "closed"}`}
      open={open}
      onOpenChange={onOpenChange}
      title="Editar periodo"
      description="Modifica los datos del periodo académico."
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>

          <Input
            id="name"
            name="name"
            defaultValue={period?.name ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start">Fecha inicio</Label>

          <Input
            id="start"
            name="start_date"
            type="date"
            defaultValue={period?.start_date ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end">Fecha cierre</Label>

          <Input
            id="end"
            name="end_date"
            type="date"
            defaultValue={period?.end_date ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evalStart">Apertura evaluación</Label>

          <Input
            id="evalStart"
            name="evaluation_end_date"
            type="date"
            defaultValue={period?.evaluation_end_date ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evalEnd">Cierre evaluación</Label>

          <Input
            id="evalEnd"
            name="final_evaluation_date"
            type="date"
            defaultValue={period?.final_evaluation_date ?? ""}
          />
        </div>
      </div>
    </FormDrawer>
  );
}

export default EditPeriodDialog;
