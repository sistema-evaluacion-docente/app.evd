import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  teachers: "Docentes",
  upload: "Cargar",
  matrix: "Matriz",
  plans: "Planes",
  evaluations: "Evaluaciones",
  dimensions: "Dimensiones",
  groups: "Grupos",
  comments: "Comentarios",
  summary: "Mi Resumen",
  me: "Mi Cuenta",
  history: "Historial",
  profile: "Perfil",
  users: "Usuarios",
  admin: "Administración",
  directors: "Directores",
  periods: "Períodos",
  settings: "Configuración",
  faculties: "Facultades",
  departments: "Departamentos",
  logs: "Logs",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent: boolean;
}

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export function AutoBreadcrumb() {
  const [location] = useLocation();

  const items = useMemo(() => {
    const segments = location.split("/").filter(Boolean);
    const result: BreadcrumbItem[] = [];

    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      if (isNumericId(segment)) {
        continue;
      }

      const isLast = i === segments.length - 1 || segments.slice(i + 1).every(isNumericId);
      const label = getLabel(segment);

      result.push({
        label,
        href: currentPath,
        isCurrent: isLast,
      });
    }

    return result;
  }, [location]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/dashboard" />}>Inicio</BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <span key={item.href} className="contents">
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              {item.isCurrent ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link to={item.href} />}>
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {index === items.length - 1 && null}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
