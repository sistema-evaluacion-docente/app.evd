import FormDrawer from "@/components/common/FormDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Setting } from "../types/Setting";

interface EditSettingDrawerProps {
  open: boolean;
  setting: Setting | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: number; value: string; change_reason?: string }) => void;
}

function EditSettingDrawer({
  open,
  setting,
  isSaving,
  onOpenChange,
  onSave,
}: EditSettingDrawerProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!setting) return;

    const formData = new FormData(event.currentTarget);

    onSave({
      id: setting.id,
      value: String(formData.get("value") ?? ""),
      change_reason: String(formData.get("change_reason") ?? "") || undefined,
    });
  };

  return (
    <FormDrawer
      key={`${setting?.id ?? "setting"}-${open ? "open" : "closed"}`}
      open={open}
      onOpenChange={onOpenChange}
      title="Editar configuración"
      description={
        setting
          ? `Modificando: ${setting.key}`
          : "Modifica el valor de la configuración."
      }
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
    >
      <div className="space-y-2">
        <Label htmlFor="key">Clave</Label>
        <Input id="key" value={setting?.key ?? ""} disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>

        {setting?.value_type === "NUMBER" ? (
          <Input
            id="value"
            name="value"
            type="number"
            step="any"
            defaultValue={setting?.value ?? ""}
            required
          />
        ) : (
          <Input
            id="value"
            name="value"
            defaultValue={setting?.value ?? ""}
            required
          />
        )}

        {setting?.description ? (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="change_reason">Motivo del cambio (opcional)</Label>

        <textarea
          id="change_reason"
          name="change_reason"
          placeholder="¿Por qué se modifica este valor?"
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </FormDrawer>
  );
}

export default EditSettingDrawer;
