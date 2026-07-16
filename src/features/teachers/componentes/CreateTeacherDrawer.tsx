import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetDepartments } from '@/features/departments'
import { Save } from 'lucide-react'
import useCreateTeacher from '../hooks/useCreateTeacher'

const CONTRACT_TYPES = ['Tiempo completo', 'Medio tiempo', 'Por horas'] as const

interface CreateTeacherDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateTeacherDrawer({ open, onOpenChange }: CreateTeacherDrawerProps) {
  const createMutation = useCreateTeacher()

  const { data: departmentsData } = useGetDepartments({ page: 1, limit: 100 })

  const departments = departmentsData?.data ?? []

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    institutional_code: '',
    department_id: '',
    contract_type: '',
  })

  const isSubmitting = createMutation.isPending
  const isValid =
    form.name.trim() && form.email.trim() && form.username.trim() && form.institutional_code.trim()

  function resetForm() {
    setForm({
      name: '',
      email: '',
      username: '',
      institutional_code: '',
      department_id: '',
      contract_type: '',
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid) return

    createMutation.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        institutional_code: form.institutional_code.trim(),
        department_id: form.department_id ? Number(form.department_id) : undefined,
        contract_type: form.contract_type || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Docente creado exitosamente')
          resetForm()
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Error al crear el docente')
        },
      },
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader className="mb-4">
          <DrawerTitle>Nuevo docente</DrawerTitle>

          <DrawerDescription>Complete los datos del nuevo docente.</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del docente"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@institucion.edu"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Nombre de usuario"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institutional_code">Código institucional</Label>
                <Input
                  id="institutional_code"
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

              <div className="space-y-2">
                <Label>Tipo de contrato</Label>

                <Select
                  value={form.contract_type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, contract_type: value ?? '' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de contrato" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="">Sin contrato</SelectItem>

                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>

              <Select
                value={form.department_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, department_id: value ?? '' }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin departamento</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DrawerClose>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DrawerClose>

            <Button type="submit" disabled={!isValid || isSubmitting}>
              <Save />
              {isSubmitting ? 'Creando...' : 'Crear docente'}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export default CreateTeacherDrawer
