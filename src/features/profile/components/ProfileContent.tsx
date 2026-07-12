import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";

import formatDate from "@/lib/formatDate";
import useAuth from "@/shared/hooks/useAuth";
import { PageHeader } from "@/shared/ui";
import useGetProfile from "../hooks/useGetProfile";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>

      <div className="mt-1.5 font-semibold leading-snug">{children}</div>
    </div>
  );
}

function NotificationRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-3.5 sm:items-center">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>

        <div className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </div>
      </div>

      <Switch checked={value} onCheckedChange={onChange} />
    </li>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const { data: profileData } = useGetProfile();

  const [emailNotif, setEmailNotif] = useState(true);
  const [reminderNotif, setReminderNotif] = useState(true);

  const profile = profileData?.data;

  const displayName = profile?.name ?? user?.name ?? "";
  const displayEmail = profile?.email ?? user?.email ?? "";
  const displayFaculty = profile?.facultad ?? profile?.department_name ?? "";
  const displayDepartment = profile?.department_name ?? "";
  const displayVinculacion = profile?.vinculacion ?? "";
  const displayJoinedAt = profile?.created_at
    ? formatDate(profile.created_at)
    : "";

  return (
    <div className="max-w-container space-y-5">
      <PageHeader
        title="Mi Perfil"
        description="Vista y gestión de sus datos institucionales."
      />

      <Card className="p-0">
        <CardHeader className="border-b px-5 pt-3 pb-3!">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-md font-semibold">Información Institucional</h2>

            <Badge variant="outline">
              <ShieldCheck size={12} />
              Solo lectura
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 p-5 sm:p-8 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr_1fr] lg:gap-10">
            <div className="flex md:block">
              <div className="relative">
                <AspectRatio
                  ratio={1 / 1}
                  className="w-50 h-50 rounded-full bg-gray-600 overflow-hidden"
                >
                  <img
                    src={
                      profile?.avatar_url ??
                      "https://preview.redd.it/why-people-like-avatar-v0-np9yl8j9xsre1.jpeg?auto=webp&s=19803ea96aaefba6ec5b59a2120791b7f7adbcbf"
                    }
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>

                <span className="absolute bottom-2 right-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-pop">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> Activa
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <Field label="Nombre completo">{displayName}</Field>
              <Field label="Facultad">{displayFaculty}</Field>
              <Field label="Tipo de vinculación">{displayVinculacion}</Field>
            </div>

            <div className="space-y-6">
              <Field label="Correo institucional">
                <a
                  href={`mailto:${displayEmail}`}
                  className="text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                >
                  {displayEmail}
                </a>
              </Field>

              <Field label="Departamento">{displayDepartment}</Field>

              <Field label="Estado de la cuenta">
                <Badge
                  className={profile?.active ? "bg-emerald-500" : "bg-gray-500"}
                >
                  {profile?.active ? "Activa" : "Inactiva"}
                </Badge>
              </Field>

              <Field label="Fecha de creación">{displayJoinedAt}</Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5">
        <Card className="p-0">
          <CardHeader className="border-b px-5 pt-3 pb-3! flex items-center justify-between">
            <h2 className="text-md font-semibold">
              Preferencias de notificación
            </h2>
          </CardHeader>

          <CardContent className="p-0">
            <ul className="px-6 divide-y">
              <NotificationRow
                title="Nuevos comentarios en mis evaluaciones"
                description="Recibe un correo cuando existan nuevos comentarios."
                value={emailNotif}
                onChange={setEmailNotif}
              />

              <NotificationRow
                title="Recordatorios de plan de mejoramiento"
                description="Avisos cuando una meta esté próxima a vencer."
                value={reminderNotif}
                onChange={setReminderNotif}
              />
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProfileContent;
