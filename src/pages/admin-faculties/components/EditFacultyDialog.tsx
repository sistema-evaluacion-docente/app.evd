import FormDrawer from "@/components/common/FormDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Faculty } from "@/features/faculties";

interface EditFacultyDialogProps {
  open: boolean;
  faculty: Faculty | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: number; name: string; code?: string }) => void;
}

function EditFacultyDialog({
  open,
  faculty,
  isSaving,
  onOpenChange,
  onSave,
}: EditFacultyDialogProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!faculty) return;

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");

    onSave({
      id: faculty.id,
      name: String(formData.get("name") ?? ""),
      code: code || undefined,
    });
  };

  return (
    <FormDrawer
      key={`${faculty?.id ?? "faculty"}-${open ? "open" : "closed"}`}
      open={open}
      onOpenChange={onOpenChange}
      title="Editar facultad"
      description="Modifica los datos de la facultad."
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>

          <Input
            id="name"
            name="name"
            defaultValue={faculty?.name ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>

          <Input
            id="code"
            name="code"
            defaultValue={faculty?.code ?? ""}
            placeholder="Código"
          />
        </div>
      </div>
    </FormDrawer>
  );
}

export default EditFacultyDialog;
