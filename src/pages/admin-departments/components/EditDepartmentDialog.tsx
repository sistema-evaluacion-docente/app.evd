import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import FormDrawer from "@/components/common/FormDrawer";
import type { Department } from "@/features/departments";
import { getFaculties } from "@/features/faculties";
interface EditDepartmentDialogProps {
  open: boolean;
  department: Department | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: number;
    name: string;
    code?: string;
    faculty_id?: number;
  }) => void;
}

function EditDepartmentDialog({
  open,
  department,
  isSaving,
  onOpenChange,
  onSave,
}: EditDepartmentDialogProps) {
  const [facultyId, setFacultyId] = useState<string>(
    department?.faculty_id ? String(department.faculty_id) : "",
  );

  const { data: facultiesData } = useQuery({
    queryKey: ["faculties"],
    queryFn: getFaculties,
  });

  const faculties = facultiesData?.data ?? [];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!department) return;

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");

    onSave({
      id: department.id,
      name: String(formData.get("name") ?? ""),
      code: code || undefined,
      faculty_id: facultyId ? Number(facultyId) : undefined,
    });
  };

  return (
    <FormDrawer
      key={department?.id ?? "department"}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>

            <Input
              id="code"
              name="code"
              defaultValue={department?.code ?? ""}
              placeholder="Código opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>Facultad</Label>

            <Select
              defaultValue={facultyId}
              onValueChange={(value) => setFacultyId(value as string)}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <span className="text-muted-foreground">
                  {facultyId
                    ? (faculties.find((f) => f.id === Number(facultyId))
                        ?.name ?? "")
                    : "Sin facultad"}
                </span>
              </SelectTrigger>

              <SelectContent className="w-full">
                <div className="flex flex-col gap-2 p-2">
                  <SelectItem value="">Sin facultad</SelectItem>

                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </FormDrawer>
  );
}

export default EditDepartmentDialog;
