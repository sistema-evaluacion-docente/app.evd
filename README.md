# EVD - Frontend App

Interfaz web para el sistema de evaluación docente desarrollado como proyecto de tesis. Permite a directores, docentes y administradores gestionar evaluaciones, visualizar métricas y administrar cuentas.

## Herramientas y versiones

| Herramienta  | Versión |
| ------------ | ------- |
| Node.js      | >= 20   |
| pnpm         | >= 9    |
| React        | 19      |
| TypeScript   | 6       |
| Vite         | 8       |
| Tailwind CSS | 4       |

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd DistilUmbert-front

# Instalar dependencias

npm install -g pnpm

pnpm install
```

## Comandos

```bash
# Servidor de desarrollo (http://localhost:5173)
pnpm dev

# Build de producción
pnpm build

# Vista previa del build
pnpm preview

# Linter
pnpm lint
```

## Rutas disponibles

| Ruta                  | Descripción           | Rol         |
| --------------------- | --------------------- | ----------- |
| `/login`              | Inicio de sesión      | Todos       |
| `/dashboard`          | Panel principal       | Director    |
| `/teachers`           | Listado de docentes   | Director    |
| `/teachers/:id`       | Detalle de docente    | Director    |
| `/matrix`             | Matriz de evaluación  | Director    |
| `/plans`              | Planes de mejora      | Director    |
| `/upload-evaluations` | Carga de evaluaciones | Director    |
| `/upload-teachers`    | Carga de docentes     | Director    |
| `/me/summary`         | Mi resumen            | Docente     |
| `/me/history`         | Mi historial          | Docente     |
| `/me/profile`         | Mi perfil             | Docente     |
| `/admin/directors`    | Gestión de directores | Super Admin |
| `/admin/periods`      | Gestión de periodos   | Super Admin |
| `/admin/logs`         | Registros del sistema | Super Admin |

## Estructura del proyecto

```
src/
├── app/          # Punto de entrada, rutas, estilos globales
├── pages/        # Páginas por ruta
├── widgets/      # Bloques de UI compuestos (layout, header, sidebar)
├── features/     # Funcionalidades acotadas (ej: carga de cuentas)
├── entities/     # Modelos de dominio (docente, evaluación)
└── shared/       # UI base, utilidades y assets reutilizables
```

La arquitectura sigue la metodología [Feature-Sliced Design](https://feature-sliced.design/).
