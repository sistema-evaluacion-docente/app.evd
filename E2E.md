# Pruebas end-to-end (Cypress)

Cubren dos RF:

- **Inicio de sesión con correo y con cuenta de Google, validación del token en cada petición y
  rechazo del token vencido o ausente.**
- **Un usuario con varios roles elige con cuál opera, y esa elección persiste en el navegador.**
- **El administrador crea usuarios, los lista, reemplaza sus roles y activa o desactiva su estado.**
- **Cada endpoint y cada ruta están restringidos por rol, y el menú oculta lo que el rol no puede
  abrir. El filtrado del menú es una comodidad de interfaz; el control efectivo vive en la API.**

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
ese rol puede abrir. `security/access-control.cy.ts` necesita los tres roles del enum
(`ADMIN`, `DOCENTE`, `DIRECTOR DE DEPARTAMENTO`) para la parte del menú, aunque esa parte la cubre la
misma cuenta que ya usa todo lo demás — no hace falta nada nuevo ahí.

Por lo demás los roles concretos dan igual. Las pruebas de autenticación no dan por hecho ninguno:
leen los que la cuenta tenga y navegan solo a `/home` y `/notificaciones`, permitidas para los tres
(ver `src/config/security.ts`).

### Cuentas que las pruebas crean solas

`security/access-control.cy.ts` no puede probar la restricción por rol con una cuenta que tiene los
tres roles a la vez — necesita cuentas que genuinamente **no** tengan el rol que se está negando. Así
que en su `before()` crea dos cuentas reales y desechables, una con solo `DOCENTE` y otra con solo
`DIRECTOR DE DEPARTAMENTO`: primero un alta de verdad en Firebase
(`accounts:signUp`, con la `firebaseApiKey` expuesta en `cypress.config.ts`), luego el alta en el
backend con `cy.api()` fijando ese único rol. `after()` las deja inactivas, igual que
`admin/users.cy.ts` con su usuario de prueba.

Un `POST /users/` fallido a mitad de esa creación (un `institutional_code` repetido, por ejemplo)
puede dejar un usuario de Firebase sin su contraparte en el backend — inofensivo, invisible en
cualquier listado, pero no limpiable sin acceso al Admin SDK. El código de cada cuenta incluye la
marca de tiempo de la corrida (`institutional_code: \`${marca}-${label}\``) precisamente para que dos
corridas nunca choquen entre sí.

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
- Reemplaza los roles de un usuario, cambiando entre Docente y Director.
- Desactiva a un usuario, que desaparece del listado, y vuelve a activarlo.

`cypress/e2e/security/access-control.cy.ts`

Tres capas, tres formas distintas de probar el mismo RF:

- **Menú** (comodidad de interfaz) — con la cuenta de tres roles cambiando de rol, como en
  `roles.cy.ts`: cada rol ve en el menú lateral lo suyo y no lo de los otros dos.
- **Rutas** (control de la interfaz, pero de verdad) — con las cuentas de un solo rol, entrando por
  la interfaz: escribir a mano una ruta que el rol operado no puede abrir muestra «Acceso no
  autorizado», no solo la esconde del menú; las suyas sí abren.
- **API** (el control real) — llamando a los endpoints directamente con el token de esas cuentas, sin
  pasar por la interfaz: los de solo administrador rechazan a ambas cuentas; los de solo director
  rechazan a la de docente y aceptan a la de director; los comunes a cualquier autenticado aceptan a
  las dos.

Y la prueba que las conecta: un docente que fuerza el rol operado a `ADMIN` escribiendo directamente
en `localStorage` (sin pasar por el selector de rol, que sí valida) consigue que el menú y la ruta se
lo crean — pero la petición que la página de Usuarios dispara sale con su token real de docente, y la
API la rechaza igual. El dato nunca llega, disfraz o no: la comodidad de interfaz es exactamente eso,
comodidad; el candado real está en la API.

`cypress/e2e/auth/token.cy.ts`

- Cada petición al backend viaja firmada con un ID token vigente de esta sesión.
- Sin sesión no sale ninguna petición: la app redirige al login antes de intentarlo.
- La API responde `401 AUTHENTICATION_FAILED` a una petición sin token y a una con token vencido.
- Con el token estropeado en el camino, la app deja al usuario fuera y muestra el error del backend.
- La sesión sobrevive a una recarga y sigue firmando.

## Cómo están hechas

### Comandos propios (`cypress/support/commands.ts`)

| Comando                                            | Qué hace                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cy.visitApp(ruta)`                                | `cy.visit` + borrado de la IndexedDB donde Firebase guarda la sesión. El aislamiento entre pruebas limpia cookies y storage, pero no esa base: sin este borrado una prueba autenticada le filtra la sesión a la siguiente. Para navegar **dentro** de una sesión ya abierta usa `cy.visit` normal. |
| `cy.watchApi()`                                    | Registra las peticiones a la API bajo el alias `@apiRequest` sin tocarlas (`req.continue()`).                                                                                                                                                                                                      |
| `cy.tamperToken('expired' \| 'missing')`           | Sustituye el token por uno caducado o quita la cabecera `Authorization`, y deja que la petición llegue al backend: así el 401 lo emite el backend de verdad.                                                                                                                                       |
| `cy.loginWithEmail()`                              | Rellena y envía el formulario. Sin argumentos usa la cuenta de pruebas.                                                                                                                                                                                                                            |
| `cy.apiAs(email, password, método, ruta, cuerpo?)` | Como `cy.api()`, pero autenticado como una cuenta arbitraria en vez de la de pruebas por defecto — para comprobar qué le deja hacer la API a un rol concreto. A diferencia de `cy.api()`, no falla ante una respuesta de error: un 403 aquí suele ser justo lo que la prueba espera.               |

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

**Un `before()` falla con `400 Bad Request` de Firebase, y las mismas credenciales funcionan a mano.**
Es Firebase, no la prueba: correr la suite muchas veces seguidas en poco tiempo (varias decenas de
inicios de sesión reales contra el mismo proyecto en un par de minutos) puede disparar un límite de
tasa transitorio. Espera un minuto y repite; si persiste, ahí sí es la cuenta.

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
