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
import useCreateUser from '../hooks/useCreateUser'
import { ALLOWED_USER_ROLES, type AllowedUserRole } from './userRoles'

// TODO: Move this to a constants file
const CONTRACT_TYPES = ['Tiempo completo', 'Medio tiempo', 'Por horas'] as const

interface CreateUserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * CreateUserDrawer component provides a form within a drawer to create a new user.
 * It includes fields for user details and role selection, and handles form submission.
 *
 * @param {boolean} open - Indicates whether the drawer is open.
 * @param {function} onOpenChange - Callback function to handle drawer open state changes.
 */
function CreateUserDrawer({ open, onOpenChange }: CreateUserDrawerProps) {
  const createMutation = useCreateUser()

  const { data: departmentsData } = useGetDepartments({ page: 1, limit: 100 })
  const departments = departmentsData?.data ?? []

  const [form, setForm] = useState({
    name: '',
    email: '',
    institutional_code: '',
    contract_type: '',
    department_id: '',
  })

  const [selectedRoles, setSelectedRoles] = useState<AllowedUserRole[]>([])

  const isSubmitting = createMutation.isPending
  const isEmailValid = form.email.trim().endsWith('@ufps.edu.co')
  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    isEmailValid &&
    form.institutional_code.trim() &&
    form.department_id &&
    selectedRoles.length > 0

  function resetForm() {
    setForm({
      name: '',
      email: '',
      institutional_code: '',
      contract_type: '',
      department_id: '',
    })
    setSelectedRoles([])
  }

  function toggleRole(role: AllowedUserRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role],
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid) return

    createMutation.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        institutional_code: form.institutional_code.trim(),
        contract_type: form.contract_type || undefined,
        department_id: Number(form.department_id),
        roles: selectedRoles,
      },
      {
        onSuccess: () => {
          toast.success('Usuario creado exitosamente')
          resetForm()
          onOpenChange(false)
        },
        onError: (err) => {
          toast.error(err.message || 'Error al crear el usuario')
        },
      },
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader className="mb-4">
          <DrawerTitle>Nuevo usuario</DrawerTitle>
          <DrawerDescription>Complete los datos del nuevo usuario.</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-name">Nombre completo</Label>

              <Input
                id="create-user-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del usuario"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email</Label>

              <Input
                id="create-user-email"
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
                <Label htmlFor="create-user-code">Código institucional</Label>

                <Input
                  id="create-user-code"
                  value={form.institutional_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      institutional_code: e.target.value,
                    }))
                  }
                  placeholder="Código del usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <Select
                  value={form.contract_type}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      contract_type: value ?? '',
                    }))
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
                  <span>
                    {form.department_id
                      ? departments.find((d) => String(d.id) === form.department_id)?.name
                      : 'Seleccionar departamento'}
                  </span>
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

            <div className="space-y-2">
              <Label>Roles</Label>

              <p className="text-muted-foreground text-xs">
                Seleccione al menos un rol para el usuario.
              </p>

              <div className="space-y-2">
                {ALLOWED_USER_ROLES.map((role) => {
                  const checked = selectedRoles.includes(role)
                  return (
                    <label
                      key={role}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(role)}
                        disabled={isSubmitting}
                      />
                      <span>{role}</span>
                    </label>
                  )
                })}
              </div>
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
              {isSubmitting ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export default CreateUserDrawer
