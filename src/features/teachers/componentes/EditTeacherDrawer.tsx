import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

import { Save } from "lucide-react";
import useUpdateTeacher from "../hooks/useUpdateTeacher";
import type { Teacher } from "../types/Teacher";

const CONTRACT_TYPES = [
  "Tiempo completo",
  "Medio tiempo",
  "Por horas",
] as const;

interface EditTeacherDrawerProps {
  open: boolean;
  teacher: Teacher | null;
  onOpenChange: (open: boolean) => void;
}

function EditTeacherDrawer({
  open,
  teacher,
  onOpenChange,
}: EditTeacherDrawerProps) {
  const updateMutation = useUpdateTeacher();

  const [form, setForm] = useState({
    name: teacher?.user?.name ?? "",
    email: teacher?.user?.email ?? "",
    institutional_code: teacher?.institutional_code ?? "",
    contract_type: teacher?.contract_type ?? "",
    active: teacher?.active ?? true,
  });

  const isSubmitting = updateMutation.isPending;
  const isValid =
    form.name.trim() && form.email.trim() && form.institutional_code.trim();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid || !teacher) return;

    updateMutation.mutate(
      {
        id: teacher.id,
        name: form.name.trim(),
        email: form.email.trim(),
        institutional_code: form.institutional_code.trim(),
        contract_type: form.contract_type || undefined,
        active: form.active,
      },
      {
        onSuccess: (data) => {
          if (data?.status !== "success") {
            toast.error(`Error: ${data?.message}`);
            return;
          }

          toast.success("Docente actualizado exitosamente");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Error al actualizar el docente");
        },
      },
    );
  }

  return (
    <Drawer
      key={teacher?.id}
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
    >
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>Editar docente</DrawerTitle>
          <DrawerDescription>Modifica los datos del docente.</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>

              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nombre del docente"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>

                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="correo@institucion.edu"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-institutional_code">
                  Código institucional
                </Label>

                <Input
                  id="edit-institutional_code"
                  value={form.institutional_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      institutional_code: e.target.value,
                    }))
                  }
                  placeholder="Código del docente"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de contrato</Label>

                <Select
                  value={form.contract_type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, contract_type: value ?? "" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="">Sin especificar</SelectItem>

                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>

                <Select
                  value={form.active ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, active: value === "true" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <span>{form.active ? "Activo" : "Inactivo"}</span>
                  </SelectTrigger>

                  <SelectContent>
                    {["true", "false"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "true" ? "Activo" : "Inactivo"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <DrawerClose>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DrawerClose>

            <Button type="submit" disabled={!isValid || isSubmitting}>
              <Save />
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default EditTeacherDrawer;
