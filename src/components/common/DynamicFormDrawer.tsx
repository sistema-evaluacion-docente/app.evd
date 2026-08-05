import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

import type { buttonVariants } from '@/components/ui/button'

import FormDrawer from './FormDrawer'

export type FieldType =
  'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'textarea' | 'select' | 'boolean'

export interface SelectOption {
  label: string
  value: string
}

export interface FieldConfig {
  name: string
  label: string
  type?: FieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  defaultValue?: string
  options?: SelectOption[]
}

export type FormValues = Record<string, string>

interface DynamicFormDrawerProps {
  fields: FieldConfig[]
  title: string
  description?: string
  triggerLabel?: string
  triggerIcon?: LucideIcon
  triggerVariant?: VariantProps<typeof buttonVariants>['variant']
  triggerSize?: VariantProps<typeof buttonVariants>['size']
  triggerClassName?: string
  submitLabel?: string
  submitSubmittingLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  onSubmit: (values: FormValues) => void
  /** Controlled open state. When provided, `onOpenChange` is required. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hide the trigger button (use with controlled `open`). */
  hideTrigger?: boolean
  className?: string
}

function buildInitialValues(fields: FieldConfig[]): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    values[field.name] = field.defaultValue ?? (field.type === 'boolean' ? 'false' : '')
  }
  return values
}

/**
 * Button that opens a `FormDrawer` with dynamically rendered inputs driven
 * by a `fields` configuration array. Manages its own open/close state and
 * form values internally; the consumer receives a flat `Record<string, string>`
 * on submit.
 *
 * @example
 * <DynamicFormDrawer
 *   title="Nuevo docente"
 *   triggerLabel="Agregar"
 *   triggerIcon={Plus}
 *   fields={[
 *     { name: 'name', label: 'Nombre', required: true },
 *     { name: 'email', label: 'Correo', type: 'email', required: true },
 *     { name: 'bio', label: 'Biografía', type: 'textarea' },
 *     { name: 'role', label: 'Rol', type: 'select', options: [{ label: 'Admin', value: 'admin' }] },
 *   ]}
 *   onSubmit={(values) => console.log(values)}
 * />
 */
export function DynamicFormDrawer({
  fields,
  title,
  description,
  triggerLabel,
  triggerIcon: TriggerIcon,
  triggerVariant = 'default',
  triggerSize = 'default',
  triggerClassName,
  submitLabel,
  submitSubmittingLabel,
  cancelLabel,
  isSubmitting = false,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  className,
}: DynamicFormDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(fields))

  const open = controlledOpen ?? internalOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      setValues(buildInitialValues(fields))
    }
  }

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <>
      {!hideTrigger && (
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          onClick={() => handleOpenChange(true)}
        >
          {TriggerIcon && <TriggerIcon aria-hidden="true" />}
          {triggerLabel}
        </Button>
      )}

      <FormDrawer
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        description={description}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        submitSubmittingLabel={submitSubmittingLabel}
        cancelLabel={cancelLabel}
        contentClassName={className}
      >
        {fields.map((field) =>
          field.type === 'boolean' ? (
            <div key={field.name} className="flex items-center justify-between gap-3">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>

              <Switch
                id={field.name}
                checked={(values[field.name] ?? 'false') === 'true'}
                onCheckedChange={(checked) => handleChange(field.name, String(checked))}
                disabled={field.disabled ?? isSubmitting}
              />
            </div>
          ) : (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>

              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  disabled={field.disabled ?? isSubmitting}
                  value={values[field.name] ?? ''}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={values[field.name] ?? ''}
                  onValueChange={(value) => handleChange(field.name, String(value))}
                  disabled={field.disabled ?? isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={field.placeholder ?? `Selecciona ${field.label.toLowerCase()}`}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  required={field.required}
                  disabled={field.disabled ?? isSubmitting}
                  value={values[field.name] ?? ''}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              )}
            </div>
          ),
        )}
      </FormDrawer>
    </>
  )
}
