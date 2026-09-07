# Pruebas end-to-end (Cypress)

Cubren el RF de **inicio de sesión con correo y con cuenta de Google, validación del token en cada
petición y rechazo del token vencido o ausente**.

Corren contra la pila real: el proyecto real de Firebase y el backend real. No hay mocks de
autenticación ni de la API — `cy.intercept` aparece solo para _observar_ una petición o para
_estropear_ la credencial que sale hacia el backend, nunca para inventar una respuesta. Eso las hace
lentas y dependientes del entorno, y a cambio prueban lo que de verdad pasa en producción.

## Requisitos

| Qué                                   | Por qué                                                         |
| ------------------------------------- | --------------------------------------------------------------- |
| Node >= 20, pnpm >= 9                 | Igual que el resto del proyecto                                 |
| `.env` completo                       | Cypress lee de ahí `VITE_API_URL` y `VITE_FIREBASE_AUTH_DOMAIN` |
| La API corriendo en `VITE_API_URL`    | Las pruebas le piden respuestas reales, incluidos los 401       |
| Dev server en `http://localhost:5173` | `pnpm dev`, o deja que `pnpm test:e2e` lo levante               |
| Una cuenta de pruebas                 | Ver abajo                                                       |

### La cuenta de pruebas

Tiene que existir **en Firebase** (correo y contraseña) **y en el backend**, con el rol
`DIRECTOR DE DEPARTAMENTO` y con departamento asignado: varias pruebas navegan a `/evaluaciones` y a
`/docentes`, que son rutas de ese rol (ver `src/config/security.ts`). Con otro rol esas pruebas
fallan en el `AppLayout`, no en la autenticación.

Las credenciales son sensibles, así que no van en `cypress.config.ts` sino en `env`, que Cypress
oculta de los logs. Dos formas, elige una:

```bash
# 1. Archivo local (ya está en .gitignore)
cp cypress.env.example.json cypress.env.json
$EDITOR cypress.env.json
```

```bash
# 2. Variables de entorno, para CI
export CYPRESS_email="cuenta-de-pruebas@ufps.edu.co"
export CYPRESS_password="..."
```

Si faltan, las pruebas que inician sesión fallan con un mensaje explícito en vez de enviar el
formulario vacío y morir diez pasos después.

## Correr las pruebas

```bash
pnpm test:e2e          # levanta el dev server, corre todo y lo apaga
pnpm e2e               # solo Cypress; necesita `pnpm dev` aparte
pnpm e2e:open          # runner interactivo, para depurar
pnpm e2e --spec cypress/e2e/auth/token.cy.ts   # un solo archivo
```

## Qué se prueba

`cypress/e2e/auth/login.cy.ts`

- Entra con correo y contraseña y aterriza en el resumen, con el perfil que devuelve el backend.
- Rechaza una contraseña incorrecta y una cuenta que no existe, sin abrir sesión.
- No llama a Firebase si el formulario va vacío.
- Devuelve al usuario a la ruta que pedía antes de que le mandaran al login (`?next=`).
- El botón de Google abre el consentimiento contra el proyecto correcto de Firebase.

`cypress/e2e/auth/token.cy.ts`

- Cada petición al backend viaja firmada con un ID token vigente de esta sesión.
- Sin sesión no sale ninguna petición: la app redirige al login antes de intentarlo.
- La API responde `401 AUTHENTICATION_FAILED` a una petición sin token y a una con token vencido.
- Con el token estropeado en el camino, la app deja al usuario fuera y muestra el error del backend.
- La sesión sobrevive a una recarga y sigue firmando.

## Cómo están hechas

### Comandos propios (`cypress/support/commands.ts`)

| Comando                                  | Qué hace                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cy.visitApp(ruta)`                      | `cy.visit` + borrado de la IndexedDB donde Firebase guarda la sesión. El aislamiento entre pruebas limpia cookies y storage, pero no esa base: sin este borrado una prueba autenticada le filtra la sesión a la siguiente. Para navegar **dentro** de una sesión ya abierta usa `cy.visit` normal. |
| `cy.watchApi()`                          | Registra las peticiones a la API bajo el alias `@apiRequest` sin tocarlas (`req.continue()`).                                                                                                                                                                                                      |
| `cy.tamperToken('expired' \| 'missing')` | Sustituye el token por uno caducado o quita la cabecera `Authorization`, y deja que la petición llegue al backend: así el 401 lo emite el backend de verdad.                                                                                                                                       |
| `cy.loginWithEmail()`                    | Rellena y envía el formulario. Sin argumentos usa la cuenta de pruebas.                                                                                                                                                                                                                            |

### Selectores

Por `data-testid` (`login-email`, `login-password`, `login-submit`, `login-google`), no por clases de
Tailwind ni por jerarquía de etiquetas. Si añades una prueba que necesita un elemento nuevo, añade
también su `data-testid` en el componente.

### Configuración

`Cypress.expose('apiUrl')` y `Cypress.expose('authDomain')` para lo público; `cy.env([...])` para las
credenciales. Ojo: Cypress 16 **eliminó** `Cypress.env()`, no lo uses.

### Detalles del entorno de pruebas

- Las animaciones se apagan globalmente en `cypress/support/e2e.ts`: el navegador headless deja
  `animation-fill-mode: both` clavado en su primer fotograma y `.animate-rise` se queda en
  `opacity: 0`, con lo que Cypress da por invisible el formulario de acceso.
- Las excepciones no capturadas se ignoran: una tabla que se atraganta pintando datos reales no es un
  fallo de la autenticación, que es lo único que se prueba aquí.

## Problemas conocidos

**`bad option: --no-sandbox` al arrancar Cypress.** El binario arranca en modo Node porque el editor
exporta `ELECTRON_RUN_AS_NODE=1`. Pasa al correr desde una terminal integrada de VS Code:

```bash
env -u ELECTRON_RUN_AS_NODE pnpm e2e
```

**`cy.screenshot() timed out` en cada fallo.** En algunas configuraciones de display (Wayland) la
captura se cuelga y tapa el error real con 30 s de espera. Para ver el fallo de verdad:

```bash
pnpm e2e --config screenshotOnRunFailure=false
```

**Las pruebas que inician sesión fallan todas juntas.** Casi siempre es la cuenta: no existe en el
backend, está inactiva, o no tiene el rol `DIRECTOR DE DEPARTAMENTO`. Compruébalo primero a mano:

```bash
curl -i "$VITE_API_URL/users/auth"    # debe responder 401 AUTHENTICATION_FAILED
```

## Lo que no cubren

La ventana de consentimiento de Google es de un tercero y Cypress no puede conducirla, así que del
flujo de Google se prueba lo que es nuestro: que el botón lo arranca contra el proveedor y el
proyecto correctos. La sesión posterior al consentimiento no es automatizable sin mockear Firebase,
que es exactamente lo que estas pruebas evitan.

El «token vencido» se fabrica como un JWT caducado y sin firma válida: sin la clave privada de Google
no se puede producir uno auténtico ya expirado. El backend lo rechaza igual.
