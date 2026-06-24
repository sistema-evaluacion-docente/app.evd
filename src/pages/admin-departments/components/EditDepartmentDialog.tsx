import FormDrawer from "@/components/common/FormDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Department } from "@/features/departments";

interface EditDepartmentDialogProps {
  open: boolean;
  department: Department | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: number; name: string; code?: string }) => void;
}

function EditDepartmentDialog({
  open,
  department,
  isSaving,
  onOpenChange,
  onSave,
}: EditDepartmentDialogProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!department) return;

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");

    onSave({
      id: department.id,
      name: String(formData.get("name") ?? ""),
      code: code || undefined,
    });
  };

  return (
    <FormDrawer
      key={`${department?.id ?? "department"}-${open ? "open" : "closed"}`}
      open={open}
      onOpenChange={onOpenChange}
      title="Editar departamento"
      description="Modifica los datos del departamento."
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={department?.name ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            name="code"
            defaultValue={department?.code ?? ""}
            placeholder="Código opcional"
          />
        </div>
      </div>
    </FormDrawer>
  );
}

export default EditDepartmentDialog;
