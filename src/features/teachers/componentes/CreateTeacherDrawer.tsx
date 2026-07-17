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

import useAuth from '@/shared/hooks/useAuth'
import useCreateTeacher from '../hooks/useCreateTeacher'

const CONTRACT_TYPES = ['Tiempo completo', 'Medio tiempo', 'Por horas'] as const

interface CreateTeacherDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Component for creating a new teacher using a drawer interface.
 * @param {Object} props - The component props.
 * @param {boolean} props.open - Indicates whether the drawer is open.
 * @param {function} props.onOpenChange - Callback function to handle drawer open state changes.
 *
 * @returns {JSX.Element} The rendered CreateTeacherDrawer component.
 */
function CreateTeacherDrawer({ open, onOpenChange }: CreateTeacherDrawerProps) {
  const createMutation = useCreateTeacher()
  const { user } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    institutional_code: '',
    contract_type: '',
  })

  const isSubmitting = createMutation.isPending
  const isEmailValid = form.email.trim().endsWith('@ufps.edu.co')
  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    form.email.trim().endsWith('@ufps.edu.co') &&
    form.institutional_code.trim()

  function resetForm() {
    setForm({
      name: '',
      email: '',
      institutional_code: '',
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
        institutional_code: form.institutional_code.trim(),
        department_id: user?.department_id ?? undefined,
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
