# DistilUmbert-front

Base inicial del frontend organizada con **Feature-Sliced Design (FSD)**.

## Estructura base

```text
src/
├── app/
│   ├── providers/
│   └── styles/
├── pages/
├── widgets/
├── features/
├── entities/
└── shared/
    ├── api/
    ├── config/
    ├── lib/
    ├── model/
    └── ui/
```

## Capas

- **app**: configuración global, providers y estilos globales.
- **pages**: páginas de la aplicación.
- **widgets**: bloques grandes de UI compuestos.
- **features**: funcionalidades de negocio centradas en acciones de usuario.
- **entities**: entidades de dominio y su representación.
- **shared**: utilidades reutilizables (api, config, librerías, modelos y UI base).
