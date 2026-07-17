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
import { Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useGetDepartments } from '@/features/departments'
import useCreateDirector from '../hooks/useCreateDirector'

const CONTRACT_TYPES = ['Tiempo completo', 'Medio tiempo', 'Cátedra'] as const

interface CreateDirectorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateDirectorDrawer({ open, onOpenChange }: CreateDirectorDrawerProps) {
  const createMutation = useCreateDirector()

  const { data: departmentsData } = useGetDepartments({ page: 1, limit: 100 })

  const departments = departmentsData?.data ?? []

  const [form, setForm] = useState({
    name: '',
    email: '',
    institutional_code: '',
    contract_type: '',
    department_id: '',
  })

  const isSubmitting = createMutation.isPending
  const isEmailValid = form.email.trim().endsWith('@ufps.edu.co')
  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    isEmailValid &&
    form.institutional_code.trim() &&
    form.department_id

  function resetForm() {
    setForm({
      name: '',
      email: '',
      institutional_code: '',
      contract_type: '',
      department_id: '',
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid) return

    createMutation.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        username: '',
        uid: '',
        avatar_url: '',
        institutional_code: form.institutional_code.trim(),
        contract_type: form.contract_type || '',
        department_id: Number(form.department_id),
      },
      {
        onSuccess: (data) => {
          if (data.status === 201) {
            toast.success('Director creado exitosamente')
            resetForm()
            onOpenChange(false)
          } else {
            toast.error(data?.message)
          }
        },
        onError: () => {
          toast.error('Error al crear el director')
        },
      },
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader className="mb-4">
          <DrawerTitle>Nuevo director</DrawerTitle>

          <DrawerDescription>
            Complete los datos del nuevo director de departamento.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>

              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del director"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ufps.edu.co"
                required
              />

              {form.email && !isEmailValid && (
                <p className="text-destructive text-sm">El email debe terminar en @ufps.edu.co</p>
              )}
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
                  placeholder="Código del director"
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
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>

                  <SelectContent>
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
              {isSubmitting ? 'Creando...' : 'Crear director'}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export default CreateDirectorDrawer
