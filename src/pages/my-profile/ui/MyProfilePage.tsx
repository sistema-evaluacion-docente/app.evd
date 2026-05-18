import { Info, ShieldCheck, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import {
  AppFooter,
  Avatar,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  ToggleSwitch,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

const PROFILE = {
  name: 'Dr. Alejandro Rodríguez',
  email: 'a.rodriguez@universidad.edu.co',
  faculty: 'Facultad de Ingeniería',
  department: 'Departamento de Sistemas',
  vinculacion: 'Docente de Tiempo Completo',
  idNumber: '1.020.345.678',
  phone: '+57 320 415 87 12',
  office: 'Bloque B · Oficina 304',
  joinedAt: '08 Ago 2014',
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">
        {label}
      </div>
      <div className="mt-1.5 text-[15px] font-semibold leading-snug text-ink-900">
        {children}
      </div>
    </div>
  )
}

function NotificationRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-3.5 sm:items-center">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink-900">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-ink-500">{description}</div>
      </div>
      <ToggleSwitch value={value} onChange={onChange} label={title} />
    </li>
  )
}

export function MyProfilePage() {
  const [twoFactor, setTwoFactor] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [reminderNotif, setReminderNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <AppLayout
      role="teacher"
      mainClassName="max-w-[1100px] space-y-5"
      header={{ userName: PROFILE.name, userRole: PROFILE.faculty }}
    >
      <PageHeader
        title="Mi Perfil"
        description="Gestione sus datos institucionales y configuración de seguridad."
      />

      {/* Institutional information */}
      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-ink-900">
              Información Institucional
            </h2>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink-100 px-2.5 text-[11px] font-medium text-ink-600">
              <ShieldCheck size={12} />
              Solo lectura
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 sm:p-8 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr_1fr] lg:gap-10">
          <div className="flex md:block">
            <div className="relative">
              <Avatar name={PROFILE.name} size={180} paletteIndex={0} />
              <span className="absolute bottom-2 right-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-pop">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Activa
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <Field label="Nombre completo">{PROFILE.name}</Field>
            <Field label="Facultad">{PROFILE.faculty}</Field>
            <Field label="Tipo de vinculación">{PROFILE.vinculacion}</Field>
            <Field label="Cédula">{PROFILE.idNumber}</Field>
          </div>

          <div className="space-y-6">
            <Field label="Correo institucional">
              <a
                href={`mailto:${PROFILE.email}`}
                className="text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
              >
                {PROFILE.email}
              </a>
            </Field>
            <Field label="Departamento">{PROFILE.department}</Field>
            <Field label="Estado de la cuenta">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activa
              </span>
            </Field>
            <Field label="Fecha de ingreso">{PROFILE.joinedAt}</Field>
          </div>
        </div>

        <div className="mx-5 mb-6 flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-4 sm:mx-6 sm:px-5">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600">
            <Info size={14} />
          </span>
          <p
            className="text-[13px] leading-relaxed text-ink-600"
            style={{ textWrap: 'pretty' }}
          >
            La información mostrada es suministrada por la{' '}
            <span className="font-semibold text-ink-800">División de Sistemas</span>{' '}
            y no puede ser modificada por el usuario. En caso de requerir un cambio,
            por favor contacte al{' '}
            <a href="#" className="font-semibold text-brand-700 hover:text-brand-800">
              soporte técnico institucional
            </a>
            .
          </p>
        </div>
      </Card>

      {/* Contact + security */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-ink-900">
              Datos de contacto
            </h2>
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Teléfono">{PROFILE.phone}</Field>
            <Field label="Oficina">{PROFILE.office}</Field>
            <Field label="Idioma de la plataforma">Español (Colombia)</Field>
            <Field label="Zona horaria">(UTC-5) Bogotá</Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-[18px] font-semibold text-ink-900">
            Seguridad y sesión
          </h2>
          <ul className="divide-y divide-ink-100">
            <li className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-ink-900">
                  Contraseña institucional
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-500">
                  Última actualización hace 4 meses
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordOpen(true)}
              >
                Cambiar
              </Button>
            </li>
            <li className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-ink-900">
                  Verificación en dos pasos
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-500">
                  Vía correo institucional
                </div>
              </div>
              <ToggleSwitch
                value={twoFactor}
                onChange={setTwoFactor}
                label="Verificación en dos pasos"
              />
            </li>
            <li className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-ink-900">
                  Sesiones activas
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-500">
                  2 dispositivos · última hace 12 min
                </div>
              </div>
              <Button variant="outline" size="sm">
                Ver sesiones
              </Button>
            </li>
            <li className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-brand-700">
                  Cerrar sesión en todos los dispositivos
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-500">
                  Útil si extravió un dispositivo
                </div>
              </div>
              <button
                type="button"
                className="h-8 rounded-md border border-brand-200 bg-brand-50 px-3 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
              >
                Cerrar todas
              </button>
            </li>
          </ul>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink-900">
            Preferencias de notificación
          </h2>
          <span className="text-[12px] text-ink-500">
            Aplica al correo {PROFILE.email}
          </span>
        </div>
        <ul className="divide-y divide-ink-100">
          <NotificationRow
            title="Nuevos comentarios en mis evaluaciones"
            description="Recibe un correo cuando los estudiantes publican nuevos comentarios."
            value={emailNotif}
            onChange={setEmailNotif}
          />
          <NotificationRow
            title="Recordatorios de plan de mejoramiento"
            description="Avisos cuando una meta esté próxima a vencer."
            value={reminderNotif}
            onChange={setReminderNotif}
          />
          <NotificationRow
            title="Notificaciones push (navegador)"
            description="Activa avisos en tiempo real cuando estés conectado."
            value={pushNotif}
            onChange={setPushNotif}
          />
        </ul>
      </Card>

      <AppFooter>
        {PROFILE.name} · Sistema de Evaluación Docente · v2.1
      </AppFooter>

      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} widthClass="max-w-md">
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-6">
          <div>
            <h3 className="text-[18px] font-semibold text-ink-900">
              Cambiar contraseña
            </h3>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Use al menos 12 caracteres incluyendo mayúscula, número y símbolo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        <form
          className="space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            setPasswordOpen(false)
          }}
        >
          {['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña'].map(
            (label) => (
              <div key={label}>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-600">
                  {label}
                </label>
                <Input type="password" placeholder="••••••••••••" />
              </div>
            ),
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="brand">
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
