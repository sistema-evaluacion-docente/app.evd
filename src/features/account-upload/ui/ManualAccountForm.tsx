import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { validateAccountRow } from '../lib/csv'
import { ACCOUNT_VINCULACIONES, type AccountFormValues, type AccountUploadConfig } from '../model'

export interface ManualAccountFormProps {
  config: AccountUploadConfig
  title: string
  subtitle: string
  headerRight?: ReactNode
  footerNote: string
  onCreate: (values: AccountFormValues) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Single-account creation form with live, per-field validation. */
export function ManualAccountForm({
  config,
  title,
  subtitle,
  headerRight,
  footerNote,
  onCreate,
}: ManualAccountFormProps) {
  const emptyForm: AccountFormValues = {
    codigo: '',
    nombre: '',
    email: '',
    vinculacion: ACCOUNT_VINCULACIONES[0],
    extra: config.extraOptions[0],
  }
  const [form, setForm] = useState<AccountFormValues>(emptyForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const show = (field: string) => touched[field] || submitted

  const fieldError = (field: 'codigo' | 'nombre' | 'email'): string => {
    if (!show(field)) return ''
    if (field === 'codigo') {
      if (!form.codigo) return 'Código es requerido'
      if (!config.codeRegex.test(form.codigo)) {
        return `Formato: ${config.codeFormatHint}`
      }
      return ''
    }
    if (field === 'nombre') {
      return form.nombre ? '' : 'Nombre es requerido'
    }
    if (!form.email) return 'Correo es requerido'
    if (!EMAIL_PATTERN.test(form.email)) return 'Formato de correo inválido'
    if (!/(universidad|edu)\./i.test(form.email)) {
      return 'Debe ser correo institucional'
    }
    return ''
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const errors = validateAccountRow(form, config.codeRegex, config.codeFormatHint)
    if (errors.length > 0) return
    onCreate(form)
    setForm(emptyForm)
    setTouched({})
    setSubmitted(false)
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-ink-900 text-[18px] font-semibold">{title}</h2>
          <p className="text-ink-500 mt-1 text-[13px]">{subtitle}</p>
        </div>
        {headerRight}
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          label="Código institucional"
          required
          error={fieldError('codigo')}
          help={`Formato ${config.codeFormatHint}`}
        >
          <Input
            value={form.codigo}
            onChange={(event) => setForm({ ...form, codigo: event.target.value.toUpperCase() })}
            onBlur={() => setTouched({ ...touched, codigo: true })}
            placeholder={config.codePlaceholder}
            className={fieldError('codigo') ? 'border-brand-500' : undefined}
          />
        </FormField>

        <FormField label="Nombre completo" required error={fieldError('nombre')}>
          <Input
            value={form.nombre}
            onChange={(event) => setForm({ ...form, nombre: event.target.value })}
            onBlur={() => setTouched({ ...touched, nombre: true })}
            placeholder="Dra. Elena Ramírez"
            className={fieldError('nombre') ? 'border-brand-500' : undefined}
          />
        </FormField>

        <FormField
          label="Correo institucional"
          required
          error={fieldError('email')}
          help="Debe contener universidad.edu"
          className="md:col-span-2"
        >
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            onBlur={() => setTouched({ ...touched, email: true })}
            placeholder="e.ramirez@universidad.edu.co"
            className={fieldError('email') ? 'border-brand-500' : undefined}
          />
        </FormField>

        {/* <FormField label="Tipo de vinculación" required>
          <Select
            value={form.vinculacion}
            onChange={(value) => setForm({ ...form, vinculacion: value })}
            options={ACCOUNT_VINCULACIONES}
          />
        </FormField> */}

        {/* <FormField label={config.extraLabel} required help={config.extraHelp}>
          <Select
            value={form.extra}
            onChange={(value) => setForm({ ...form, extra: value })}
            options={config.extraOptions}
          />
        </FormField> */}

        <div className="border-ink-100 mt-2 flex flex-col justify-between gap-3 border-t pt-3 sm:flex-row sm:items-center md:col-span-2">
          <p className="text-ink-500 text-[12px]">{footerNote}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm(emptyForm)
                setTouched({})
                setSubmitted(false)
              }}
            >
              Limpiar
            </Button>

            <Button type="submit">
              <Plus size={14} strokeWidth={2} />
              Crear {config.entitySingular}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

function FormField({
  label,
  required,
  error,
  help,
  children,
  className,
}: {
  label: string
  required?: boolean
  error?: string
  help?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="text-ink-600 mb-1.5 block text-[11px] font-semibold tracking-[0.06em] uppercase">
        {label}
        {required && <span className="text-brand-600 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <div className="text-brand-600 mt-1.5 inline-flex items-center gap-1 text-[11.5px]">
          <AlertTriangle size={11} /> {error}
        </div>
      ) : (
        help && <div className="text-ink-400 mt-1.5 text-[11px]">{help}</div>
      )}
    </div>
  )
}
