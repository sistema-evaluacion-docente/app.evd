# Pruebas end-to-end (Cypress)

Cubren dos RF:

- **Inicio de sesión con correo y con cuenta de Google, validación del token en cada petición y
  rechazo del token vencido o ausente.**
- **Un usuario con varios roles elige con cuál opera, y esa elección persiste en el navegador.**
- **El administrador crea usuarios, los lista, reemplaza sus roles y activa o desactiva su estado.**

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

Tiene que existir **en Firebase** (correo y contraseña) **y en el backend**, activa, y con **al menos
dos roles**. Lo de los dos roles no es opcional: el RF de selección de rol trata justamente de un
usuario que tiene varios, y sin un segundo rol no hay nada que elegir — `roles.cy.ts` falla en su
primera aserción con un mensaje que lo dice.

Uno de esos roles tiene que ser **`ADMIN`**: `admin/users.cy.ts` entra a `/admin/usuarios`, que solo
ese rol puede abrir.

Por lo demás los roles concretos dan igual. Las pruebas de autenticación no dan por hecho ninguno:
leen los que la cuenta tenga y navegan solo a `/home` y `/notificaciones`, permitidas para los tres
(ver `src/config/security.ts`).

### Datos que dejan las pruebas

`admin/users.cy.ts` crea usuarios de verdad. La API no expone borrado, así que:

- El usuario que prepara por API (`e2e-<marca>-uid`) queda **inactivo** al terminar: se limpia en el
  `after`.
- El que crea a través del formulario **no se puede limpiar**: el formulario no pide `uid`, y los
  endpoints de estado se direccionan por `uid`, así que ese usuario queda activo para siempre.

Cada ejecución deja uno. Todos comparten el prefijo `e2e-` en el correo, que es por donde purgarlos
cuando molesten.

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

`cypress/e2e/auth/roles.cy.ts`

- El menú del avatar ofrece los roles de la cuenta y marca con cuál se está operando.
- Al cambiar de rol cambia también el menú lateral, es decir, lo que el usuario puede hacer.
- La elección queda guardada en el navegador y sobrevive a recargar y a volver a entrar.
- Sin nada guardado, la app arranca en el primer rol de la cuenta.
- Cerrar el menú sin elegir no cambia nada; cerrar sesión olvida el rol elegido.

`cypress/e2e/admin/users.cy.ts`

- Lista los usuarios y los busca por correo, con su código, roles y estado.
- Crea un usuario desde el formulario y lo encuentra después en el listado.
- Rechaza un correo que no es institucional y exige al menos un rol.
- Reemplaza los roles de un usuario. **Falla hoy**, ver _Lo que no cubren_.
- Desactiva y vuelve a activar a un usuario. **Falla hoy**, por lo mismo.

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

Por `data-testid` (`login-email`, `login-password`, `login-submit`, `login-google`, `user-menu`), no
por clases de Tailwind ni por jerarquía de etiquetas. Si añades una prueba que necesita un elemento
nuevo, añade también su `data-testid` en el componente.

Para los menús desplegables se usan los `data-slot` que ya emiten los primitivos de shadcn
(`dropdown-menu-content`, `dropdown-menu-radio-item`) y su `aria-checked` / `aria-expanded`, que son
parte del contrato accesible del componente y no un detalle de estilo.

### Configuración

`Cypress.expose('apiUrl')` y `Cypress.expose('authDomain')` para lo público; `cy.env([...])` para las
credenciales. Ojo: Cypress 16 **eliminó** `Cypress.env()`, no lo uses.

### Por qué Chromium

Los scripts pasan `--browser chromium` a propósito. Con el Electron que Cypress trae de serie —que
además está deprecado como navegador de pruebas— el `requestAnimationFrame` del iframe de la app no
llega a dispararse, y eso rompe dos cosas de las que depende media suite:

- `useNavigate` envuelve cada navegación en `document.startViewTransition`, cuyo callback es quien
  cambia la ruta: la app se queda clavada en la pantalla anterior para siempre.
- Los menús de Base UI abren dentro de un `requestAnimationFrame`, así que el menú del avatar nunca
  llega a desplegarse.

Ninguna de las dos es un fallo de la app: en Chromium, y en cualquier navegador de verdad, funcionan.
Si alguna vez ves navegaciones que no ocurren o menús que no abren, comprueba primero con qué
navegador estás corriendo.

### Detalles del entorno de pruebas

Las excepciones no capturadas se ignoran (`cypress/support/e2e.ts`): una tabla que se atraganta
pintando datos reales no es un fallo de la autenticación, que es lo único que se prueba aquí.

## Problemas conocidos

**`bad option: --no-sandbox` al arrancar Cypress.** El binario arranca en modo Node porque el editor
exporta `ELECTRON_RUN_AS_NODE=1`. Pasa al correr desde una terminal integrada de VS Code:

```bash
env -u ELECTRON_RUN_AS_NODE pnpm e2e
```

**Navegaciones que no ocurren, menús que no abren.** Estás corriendo en Electron. Usa `pnpm e2e`, que
ya pasa `--browser chromium`; ver _Por qué Chromium_.

**`cy.screenshot() timed out` en cada fallo.** En algunas configuraciones de display (Wayland) la
captura se cuelga y tapa el error real con 30 s de espera. Para ver el fallo de verdad:

```bash
pnpm e2e --config screenshotOnRunFailure=false
```

**Las pruebas que inician sesión fallan todas juntas.** Casi siempre es la cuenta: no existe en el
backend o está inactiva. Si lo único que falla es `roles.cy.ts`, es que tiene un solo rol; si es
`admin/users.cy.ts`, es que le falta el rol `ADMIN`.
Compruébalo primero a mano:

```bash
curl -i "$VITE_API_URL/users/auth"    # debe responder 401 AUTHENTICATION_FAILED
```

## Dos fallos que estas pruebas destaparon

**Arreglado — la edición de usuarios no llegaba a la API.** `useUpdateUser` hacía
`PUT /users/{id}` con el id numérico, una ruta que la API no tiene: respondía
`405 Method Not Allowed` y la interfaz mostraba ese texto como error al guardar. Ahora usa las dos
rutas que sí existen, `PUT /users/{uid}/roles` y `PATCH /users/{uid}/status`, direccionadas por el
`uid` de Firebase. De paso, el formulario de edición dejó de ofrecer nombre y avatar: la API no tiene
ninguna ruta para cambiarlos en otro usuario, así que esos campos solo podían tirar lo escrito.

**Pendiente, y es del backend — el rol `ADMIN` no se puede quitar.** `PUT /users/{uid}/roles`
reemplaza bien salvo por ese rol, que se queda pegado:

```
POST  roles=['DOCENTE']   ->  ['DOCENTE']
PUT   roles=['ADMIN']     ->  ['ADMIN']
PUT   roles=['DOCENTE']   ->  ['DOCENTE', 'ADMIN']     <-- ADMIN debería haberse ido
PUT   roles=['DIRECTOR']  ->  ['DIRECTOR', 'ADMIN']
```

Por eso la prueba de reemplazo cambia entre Docente y Director sin pasar por Administrador: con
ADMIN de por medio estaría comprobando un reemplazo que el backend no llega a hacer. El arreglo va en
`api.evd`, no aquí.

## Lo que no cubren

La ventana de consentimiento de Google es de un tercero y Cypress no puede conducirla, así que del
flujo de Google se prueba lo que es nuestro: que el botón lo arranca contra el proveedor y el
proyecto correctos. La sesión posterior al consentimiento no es automatizable sin mockear Firebase,
que es exactamente lo que estas pruebas evitan.

El «token vencido» se fabrica como un JWT caducado y sin firma válida: sin la clave privada de Google
no se puede producir uno auténtico ya expirado. El backend lo rechaza igual.
