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
import { Check, Circle, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import type { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import FormDrawer from './FormDrawer'

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multiSelect'
  | 'boolean'

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
  defaultValue?: string | string[]
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
    if (field.type === 'multiSelect') {
      const defaultValue = Array.isArray(field.defaultValue) ? field.defaultValue : []
      values[field.name] = defaultValue.join(',')
    } else {
      const defaultValue = Array.isArray(field.defaultValue)
        ? field.defaultValue.join(',')
        : field.defaultValue
      values[field.name] = defaultValue ?? (field.type === 'boolean' ? 'false' : '')
    }
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

  const open = controlledOpen ?? internalOpen

  const [values, setValues] = useState<FormValues>(() => buildInitialValues(fields))
  const [prevOpen, setPrevOpen] = useState(open)

  if (prevOpen !== open) {
    setPrevOpen(open)

    if (!open) {
      setValues(buildInitialValues(fields))
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
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
          ) : field.type === 'multiSelect' ? (
            <div key={field.name} className="space-y-1.5">
              <Label>
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>

              <div className="space-y-2">
                {field.options?.map((option) => {
                  const selected = (values[field.name] ?? '').split(',').filter(Boolean)
                  const isSelected = selected.includes(option.value)
                  const toggle = () => {
                    const next = isSelected
                      ? selected.filter((value) => value !== option.value)
                      : [...selected, option.value]
                    handleChange(field.name, next.join(','))
                  }

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={field.disabled ?? isSubmitting}
                      onClick={toggle}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        isSelected
                          ? 'border-primary/50 bg-primary/5 text-foreground'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {isSelected ? (
                        <Check aria-hidden="true" className="text-primary size-4" />
                      ) : (
                        <Circle aria-hidden="true" className="text-muted-foreground/40 size-4" />
                      )}
                      {option.label}
                    </button>
                  )
                })}
              </div>
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
                    >
                      {field.options?.find((option) => option.value === values[field.name])?.label}
                    </SelectValue>
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
