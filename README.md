# Sistema de Evaluación Docente — Frontend Web

**Frontend Web**
_Sistema de Evaluación Docente — Universidad Francisco de Paula Santander (UFPS)_

---

## ¿Qué es este trabajo?

Este repositorio forma parte de nuestro proyecto de grado del programa de Ingeniería de Sistemas de la UFPS. El objetivo es construir una plataforma web que automatice el ciclo de evaluación docente: visualización de resultados, análisis de comentarios estudiantiles mediante inteligencia artificial, generación de reportes estadísticos y gestión de planes de mejora para docentes.

Este repositorio contiene la **interfaz web** del sistema, desarrollada con React, TypeScript y Tailwind CSS. El backend (API REST en FastAPI) se encuentra en un repositorio independiente: [github.com/sistema-evaluacion-docente/api.evd](https://github.com/sistema-evaluacion-docente/api.evd)

---

## Autores

| Autor              | Correo                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| Andrés Parra       | [andresalfonsopg@ufps.edu.co](mailto:andresalfonsopg@ufps.edu.co)       |
| Orlando Beltrán    | [orlandojosebv@ufps.edu.co](mailto:orlandojosebv@ufps.edu.co)           |
| Alessandro Daniele | [alessandroumbertods@ufps.edu.co](mailto:alessandroumbertds@ufps.edu.co) |

---

## Descripción

Aplicación web (SPA) que permite a directores de departamento y docentes interactuar con los resultados del proceso de evaluación docente en la UFPS. Consume una API REST construida en FastAPI y se conecta a Firebase Auth para la autenticación de usuarios.

El sistema abarca desde la carga de PDF de evaluación generados por la universidad hasta la generación de planes de mejora personalizados para docentes, pasando por el análisis de comentarios estudiantiles con modelos de lenguaje (HuggingFace).

---

## ¿Qué es el Sistema de Evaluación Docente?

La UFPS realiza una **evaluación institucional del desempeño docente** cada período académico. Los estudiantes responden un cuestionario de **22 ítems** agrupados en **4 dimensiones**, calificando a sus docentes en una escala de 0 a 5.

### Dimensiones de evaluación

| Dimensión                   | ID            | Ítems | Enfoque                                          |
| --------------------------- | ------------- | ----- | ------------------------------------------------ |
| Desarrollo del Conocimiento | `desarrollo`  | 6     | Dominio disciplinar, expresión e investigación   |
| Desempeño Docente           | `desempeno`   | 8     | Planeación, metodología, asistencia y motivación |
| Procesos de Evaluación      | `procesos`    | 4     | Criterios, retroalimentación y reflexión         |
| Integración Interpersonal   | `integracion` | 4     | Diálogo, respeto e identidad institucional       |

### Ciclo de evaluación

El sistema automatiza las siguientes etapas:

| Etapa                      | Responsable              | Descripción                                                               |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Carga de resultados        | Director de Departamento | Sube los formularios PDF generados por el sistema universitario           |
| Extracción y procesamiento | Backend (FastAPI)        | Extrae datos estructurados (docente, curso, puntajes, comentarios)        |
| Análisis con IA            | Backend (HuggingFace)    | Clasifica comentarios por nivel de riesgo y categoría pedagógica          |
| Visualización              | Frontend (esta app)      | Rankings, promedios por dimensión, matrices, historial y comparativas     |
| Planes de mejora           | Director de Departamento | Crea planes con ítems, evidencias, actas y cierre para docentes en riesgo |
| Consulta de resultados     | Docente                  | Visualiza su resumen, historial y planes de mejora                        |
| Administración del sistema | Administrador            | Gestiona usuarios, facultades, departamentos, períodos y configuración    |

---

## Estructura del proyecto

```
src/
├── app/              # Punto de entrada (main.tsx), rutas (App.tsx), estilos globales
├── pages/            # Páginas por ruta
│   ├── login/
│   ├── dashboard/
│   ├── teachers/
│   ├── evaluations/
│   ├── plans/
│   ├── admin/
│   └── my-summary/
├── widgets/          # Bloques de UI compuestos (layout, header, sidebar)
├── features/         # Funcionalidades acotadas (auth, teachers, evaluations, plans, etc.)
├── entities/         # Modelos de dominio (docente, evaluación, plan)
├── shared/           # Utilidades, hooks y tipos reutilizables
├── components/       # Componentes shadcn/ui primitivos
├── context/          # Proveedores de contexto (UserContext)
└── config/           # Configuración (axios, firebase, seguridad)
```

### Enlaces directos

| Recurso                    | Ruta                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| Punto de entrada           | [src/app/main.tsx](src/app/main.tsx)                                 |
| Definición de rutas        | [src/app/App.tsx](src/app/App.tsx)                                   |
| Modelo de dimensiones UFPS | [src/entities/evaluation/model.ts](src/entities/evaluation/model.ts) |
| Configuración de la API    | [src/config/index.ts](src/config/index.ts)                           |
| Cliente Axios              | [src/config/axios.ts](src/config/axios.ts)                           |
| Configuración Firebase     | [src/config/firebase.ts](src/config/firebase.ts)                     |
| Control de acceso por rol  | [src/config/security.ts](src/config/security.ts)                     |
| Contexto de usuario        | [src/context/UserContext.tsx](src/context/UserContext.tsx)           |
| Estilos globales y tema    | [src/app/styles/index.css](src/app/styles/index.css)                 |

---

## Stack tecnológico

| Componente          | Tecnología                              |
| ------------------- | --------------------------------------- |
| Framework UI        | React 19                                |
| Lenguaje            | TypeScript 6 (erasableSyntaxOnly)       |
| Bundler             | Vite 8 (Rolldown)                       |
| Estilos             | Tailwind CSS 4                          |
| Componentes base    | shadcn/ui (Base Vega)                   |
| Enrutamiento        | wouter                                  |
| Estado del servidor | TanStack React Query v5                 |
| Estado del cliente  | Zustand v5                              |
| Autenticación       | Firebase Auth (email/password + Google) |
| Cliente HTTP        | Axios (con interceptor Bearer)          |
| Gráficos            | Recharts                                |
| Fechas              | date-fns, dayjs                         |
| Iconos              | lucide-react                            |
| Notificaciones      | sonner                                  |
| Tablas              | @tanstack/react-table                   |
| Dark mode           | next-themes (clase `.dark`)             |
| Fuentes             | Figtree Variable + Geist Variable       |

---

## Rutas disponibles

| Ruta                          | Descripción                    | Rol      |
| ----------------------------- | ------------------------------ | -------- |
| `/login`                      | Inicio de sesión               | Todos    |
| `/dashboard`                  | Panel principal (rol-specific) | Todos    |
| `/teachers`                   | Listado de docentes            | Director |
| `/teachers/upload`            | Carga masiva de docentes       | Director |
| `/teachers/:id`               | Detalle de docente             | Director |
| `/teachers/:id/comparison`    | Comparación semestral          | Director |
| `/evaluations`                | Evaluaciones recibidas         | Director |
| `/evaluations/upload`         | Carga de evaluación PDF        | Director |
| `/evaluations/:id`            | Detalle de evaluación          | Director |
| `/evaluations/:id/dimensions` | Promedios por dimensión        | Director |
| `/evaluations/:id/teachers`   | Puntajes por docente           | Director |
| `/evaluations/:id/groups`     | Puntajes por grupo             | Director |
| `/evaluations/:id/comments`   | Comentarios estudiantiles      | Director |
| `/summary`                    | Resumen del docente            | Docente  |
| `/me/profile`                 | Perfil del docente             | Docente  |
| `/users`                      | Gestión de usuarios            | Admin    |
| `/directors`                  | Gestión de directores          | Admin    |
| `/periods`                    | Gestión de períodos            | Admin    |
| `/settings`                   | Configuración del sistema      | Admin    |
| `/faculties`                  | Gestión de facultades          | Admin    |
| `/departments`                | Gestión de departamentos       | Admin    |
| `/logs`                       | Registros de auditoría         | Admin    |

---

## Requisitos

- Node.js >= 20
- pnpm >= 9
- Proyecto Firebase habilitado (Authentication con email/contraseña y Google)
- Backend API en ejecución (ver repositorio [`api.evd`](https://github.com/sistema-evaluacion-docente/api.evd))

### Variables de entorno

Copia `.env.example` a `.env` y completa las variables:

```env
VITE_API_URL=http://localhost:8080/
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Instalación y comandos

```bash
# Instalar pnpm globalmente (si no está instalado)
npm install -g pnpm

# Instalar dependencias
pnpm install

# Servidor de desarrollo (http://localhost:5173)
pnpm dev

# Build de producción (typecheck + bundle)
pnpm build

# Vista previa del build
pnpm preview

# Linter
pnpm lint
```

---

## Arquitectura (Feature-Sliced Design)

El proyecto sigue la metodología [Feature-Sliced Design](https://feature-sliced.design/) con la siguiente jerarquía de capas:

```
app       → Configuración global, rutas, estilos
pages     → Componentes de página (una carpeta por ruta)
widgets   → Bloques compuestos reutilizables (layout, sidebar, header)
features  → Funcionalidades de negocio acotadas (auth, evaluations, plans)
entities  → Modelos de dominio (teacher, evaluation, plan)
shared    → Hooks, utilidades, tipos
```

### Flujo de autenticación

1. El usuario inicia sesión con email/contraseña o Google mediante Firebase Auth
2. El `UserContext` escucha `onAuthStateChanged` y obtiene el perfil desde `GET /users/auth`
3. El interceptor de Axios inyecta automáticamente el token Bearer de Firebase en cada petición
4. El `AppLayout` verifica que el rol seleccionado tenga acceso a la ruta actual

### Flujo de datos

1. El director sube un PDF de evaluación → WebSocket notifica el progreso en tiempo real
2. La API extrae los datos y emite eventos de progreso
3. El frontend consulta los resultados mediante TanStack React Query (caché automática)
4. Los planes de mejora se gestionan con operaciones CRUD contra la API
5. Las exportaciones a Excel se descargan como blob desde la API

---

## Referencias

- [UFPS](https://ww2.ufps.edu.co/) — Universidad Francisco de Paula Santander
- [FastAPI (backend)](https://fastapi.tiangolo.com/) — API REST del sistema
- [React](https://react.dev/) — Framework de interfaz de usuario
- [Tailwind CSS](https://tailwindcss.com/) — Framework de estilos
- [shadcn/ui](https://ui.shadcn.com/) — Componentes de interfaz
- [Firebase Auth](https://firebase.google.com/docs/auth) — Autenticación
- [TanStack Query](https://tanstack.com/query) — Estado del servidor
- [Feature-Sliced Design](https://feature-sliced.design/) — Metodología de arquitectura

---

## Licencia

El código se distribuye bajo la licencia MIT, disponible en [LICENSE](LICENSE).
