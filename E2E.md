# Pruebas end-to-end (Cypress)

Cubren estos RF:

- **Inicio de sesión con correo y con cuenta de Google, validación del token en cada petición y
  rechazo del token vencido o ausente.**
- **Un usuario con varios roles elige con cuál opera, y esa elección persiste en el navegador.**
- **El administrador crea usuarios, los lista, reemplaza sus roles y activa o desactiva su estado.**
- **Cada endpoint y cada ruta están restringidos por rol, y el menú oculta lo que el rol no puede
  abrir. El filtrado del menú es una comodidad de interfaz; el control efectivo vive en la API.**
- **Un director está aislado de los recursos de otro departamento: pedir el detalle de un recurso
  ajeno responde `403`, no un listado vacío.**
- **El administrador crea, consulta, actualiza y elimina facultades.**
- **El administrador crea, consulta, actualiza y elimina departamentos, y asigna o retira el
  director de cada uno.**
- **El administrador gestiona los directores de departamento.**
- **El administrador gestiona los programas académicos: los crea, consulta, actualiza y elimina.**
- **El sistema gestiona cursos y grupos académicos, incluida la modalidad del grupo (presencial o a
  distancia).**
- **El director puede cargar los PDF oficiales de evaluación correspondientes a un periodo y a su
  departamento.**
- **El sistema debe aceptar hasta dos PDF por evaluación, uno para programas presenciales y otro
  para programas a distancia. Ambos deben coincidir en periodo y departamento y pertenecer a
  modalidades distintas.**
- **El sistema permite renombrar una materia conservando su código, para preservar el histórico y
  las comparaciones entre periodos.**
- **Extracción del docente, el curso, el grupo, las 22 preguntas, las 4 dimensiones, los puntajes y
  los comentarios.**
- **El procesamiento de las evaluaciones debe ejecutarse en segundo plano y reportar su progreso en
  tiempo real. La evaluación transita por los estados PROCESSING, COMPLETED o FAILED.**
- **El sistema debe permitir consultar evaluaciones por identificador, por periodo y en listado
  paginado, junto con su resumen, sus promedios por dimensión y su detalle por dimensión. Solo por
  el director que tenga asignado ese departamento.**
- **El director debe poder descargar el PDF original desde un endpoint con verificación de
  permisos. Los archivos subidos nunca se sirven como contenido estático.**
- **El sistema debe clasificar cada comentario por nivel de riesgo y por categoría pedagógica
  mediante modelos de HuggingFace ejecutados de forma local.**
- **El director debe poder consultar los comentarios filtrados y contarlos por departamento y
  periodo, así como por docente y periodo.**
- **El director debe poder corregir manualmente el nivel de riesgo y las categorías pedagógicas
  asignadas a un comentario.**

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

`cypress/e2e/admin/faculties.cy.ts`

- Crea una facultad desde el formulario y la encuentra después en el listado, sin departamentos.
- Busca una facultad por nombre o código.
- Actualiza el nombre, el código y el estado de una facultad; al desactivarla, desaparece de la
  búsqueda por defecto (que solo muestra activas).
- Elimina una facultad, que desaparece del listado.

A diferencia de usuarios, `/faculties/` sí expone borrado real: cada prueba crea su propia facultad
desechable por API y la deja limpia — sin `institutional_code` ni Firebase de por medio, no hace
falta nada del rastro que sí dejan las de usuarios.

`cypress/e2e/admin/departments.cy.ts`

- Crea un departamento desde el formulario y lo encuentra después en el listado, sin director.
- Busca un departamento por nombre o código.
- Actualiza el nombre, el código y el estado de un departamento; al desactivarlo, desaparece de la
  búsqueda por defecto.
- Elimina un departamento, que desaparece del listado.
- Asigna un director desde la lista de usuarios elegibles (`DOCENTE` o `DIRECTOR DE DEPARTAMENTO`) y
  lo desasigna, verificando en ambos casos lo que muestra la fila (`Sin asignar` frente al nombre del
  director) y que desasignar retira también el rol `DIRECTOR DE DEPARTAMENTO` del usuario (asignar sí
  lo añade), no solo la fila de `directors`.

Como `/faculties/`, `/departments/` expone borrado real: cada departamento es su propio fixture
desechable por API. Las dos pruebas de director comparten una única cuenta Firebase de un solo rol
(`DOCENTE`), creada una vez porque cada alta es un registro real — igual que en
`security/department-isolation.cy.ts` — y cada una la deja sin departamento asignado al terminar para
no depender del orden en que corran.

`cypress/e2e/admin/directors.cy.ts`

- Busca y encuentra a un director en `/admin/directores`, con su departamento y su código
  institucional visibles en la tabla.
- Elimina un director desde esta pantalla (`DELETE /directors/{id}`, distinto del
  `DELETE /departments/{id}/director` que prueba `admin/departments.cy.ts`): desaparece de la tabla,
  el usuario pierde el rol `DIRECTOR DE DEPARTAMENTO` (conservando sus demás roles) y su departamento
  vuelve a quedar sin director.

Como en `departments.cy.ts`, no hay pantalla de alta ni de edición — la API expone
`POST`/`PUT /directors/`, pero el frontend no los usa — así que el único camino real para que exista
un director sigue siendo asignarlo desde un departamento (`POST /departments/{id}/director`). Cada
prueba crea su propio departamento desechable y reutiliza la misma cuenta de un solo rol (`DOCENTE`).

Límite conocido, sin arreglar a pedido del usuario: `GET /directors/` busca por nombre, correo y
nombre/código del departamento, pero no por el `institutional_code` del director, aunque la columna
"Código" lo muestra y el tipo `DirectorParams` del frontend documenta que sí se busca por él. La
prueba busca por nombre, que sí funciona.

`cypress/e2e/admin/programs.cy.ts`

- Crea un programa académico desde el formulario y lo encuentra después en el listado.
- Busca un programa por nombre o código.
- Actualiza el nombre, el código y el estado de un programa; al desactivarlo, desaparece de la
  búsqueda por defecto.
- Elimina un programa, que desaparece del listado.

Como `/faculties/`, `/programs/` expone borrado real y no tiene relaciones con otros recursos (a
diferencia de departamentos, sin facultad ni director que gestionar): cada prueba crea su propio
programa desechable por API y lo deja limpio.

`cypress/e2e/admin/academic-groups.cy.ts`

- Crea un curso, lo consulta, actualiza su nombre y lo elimina.
- Crea un grupo académico en modalidad presencial y lo encuentra filtrando el listado por esa
  modalidad, no por la otra.
- Cambia la modalidad de un grupo de presencial a distancia y lo comprueba tanto en el grupo como en
  los dos filtros.
- Elimina un grupo académico, que desaparece del listado.

A diferencia de las demás pruebas de administración, no hay pantalla para esto: ni `/courses/` ni
`/academic-groups/` tienen una página de gestión en la interfaz. En producción el sistema crea estos
recursos al procesar el PDF de una evaluación — la modalidad se lee del título de cada página del
documento, no de un formulario (`api/utils/modalities.py` en `api.evd`) — y lo único que toca la
interfaz es de solo lectura (`CourseSelect`) o de edición parcial (`EvaluationCoursesReview`, que solo
renombra un curso ya extraído). El resto de la gestión solo existe en la API, así que la prueba se
queda en esa capa, como la parte "API" de `security/access-control.cy.ts`. Un periodo académico y un
docente desechables se comparten entre las cuatro pruebas (`before`/`after`); cada curso y cada grupo
son propios de su prueba y se borran al terminar.

`cypress/e2e/evaluations/upload.cy.ts`

- Un director asignado de verdad (`POST /departments/{id}/director`) a un departamento sube
  `cypress/files/2025-1.pdf` — un PDF real de la universidad, no uno fabricado para la prueba — y
  termina viendo la evaluación creada, con el periodo y el departamento que el propio PDF trae
  grabados, no elegidos en el formulario.
- Un director de otro departamento intenta subir el mismo PDF y la API lo rechaza: el departamento
  que imprime el documento no es el suyo.

El backend no recibe el periodo ni el departamento como campos del formulario: los lee del contenido
del PDF (`api/utils/pdf_parser.py` en `api.evd`) — el título de cada página ("... Segundo Semestre de
2025" → periodo `2025-2`) y la línea de departamento ("99 TESTING" → código `99`). Por eso, a
diferencia del resto de fixtures de este repo, el departamento de la prueba no puede aleatorizarse con
`marca`: viene fijo en el PDF, así que la prueba busca (o crea, si no existe) el departamento de
código `99` y lo usa tal cual. El procesamiento en segundo plano crea profesores, cursos y grupos bajo
ese departamento y ese periodo — igual que documenta `academic-groups.cy.ts` para el resto de PDFs de
evaluación — y no hay forma de borrarlos en bloque, así que quedan puestos entre corridas. Lo único que
la prueba limpia es lo suyo: la evaluación creada (borrarla exige el token del propio director del
departamento, ni siquiera ADMIN vale — `require_roles([DIRECTOR_DE_DEPARTAMENTO])` en la ruta) y las
dos cuentas de director desechables.

`cypress/e2e/evaluations/upload-modalities.cy.ts`

- Un director sube en un solo formulario `cypress/files/2025-1.pdf` (presencial) y
  `cypress/files/2025-1-DISTANCIA.pdf` (a distancia) — dos reportes reales, no fabricados — y la API
  los fusiona en una sola evaluación: mismo periodo (`2025-2`) y departamento (`99`) que traen
  grabados, un documento guardado por modalidad (`pdf_urls`) y docentes propios en cada una.
- El selector de archivos ya impide elegir el mismo PDF dos veces (mismo nombre y tamaño → "Ya
  adjuntó..."), así que nunca llegaría a probar la validación del backend que exige modalidades
  distintas. Esa parte del RF se prueba llamando al endpoint real directamente, sin pasar por la
  interfaz: el mismo PDF de distancia subido dos veces con nombres de archivo distintos vuelve `422`
  con "Los dos PDFs corresponden a la misma modalidad".

Comparte el departamento fijo `99` con `upload.cy.ts` (impreso en el PDF, no aleatorizable) y el
mismo residuo entre corridas: los profesores, cursos y grupos que deja el procesamiento en segundo
plano no se pueden borrar en bloque. La prueba de la validación de modalidad no puede pasar por
`cy.request`: manda el cuerpo como string y corrompe cualquier byte mayor a 127, lo que rompe un PDF
real antes de que el backend llegue a comparar modalidades (se vio como un `400` de "PDF dañado" en
vez del `422` esperado). En su lugar usa un `cy.task` (`uploadMultipart`, en `cypress.config.ts`) que
arma el `multipart/form-data` con un `Blob` real desde Node, byte a byte. Lo que no cubre: un
desajuste de periodo o de departamento _entre los dos PDF_ — los dos fixtures disponibles comparten
ambos a propósito, y fabricar un tercer PDF solo para forzar el desajuste iría en contra de usar
únicamente reportes reales de la universidad.

`cypress/e2e/evaluations/rename-course.cy.ts`

- Un director sube el PDF real de evaluación, entra a "Revisar materias" y renombra una materia
  en línea; el código, al lado, no cambia.

Como `academic-groups.cy.ts` documenta, un curso no tiene pantalla de alta propia — solo existe a
partir de un PDF procesado — así que el fixture es el mismo PDF de `upload.cy.ts`
(`cypress/files/2025-1.pdf`, departamento fijo `99`) y una materia real que trae grabada
("SISTEMAS OPERATIVOS", código `1155604`). El curso tiene grupos académicos asociados y
`DELETE /courses/{id}` los rechaza, así que no se puede borrar: la prueba restaura el nombre
original al terminar en vez de dejarlo con un nombre de prueba, y solo limpia del todo lo que sí
puede — la evaluación que ella misma crea y la cuenta de director.

Al verificar el RF contra el servidor real apareció un bug real: la única función que llama a esto
en el frontend (`useUpdateCourse`) pedía `PUT /courses/{id}`, restringido a `ADMIN` en la API —
pero las dos pantallas que la usan (esta y `/materias`) están restringidas a
`DIRECTOR DE DEPARTAMENTO` en `security.ts`. Un director real que no fuera también `ADMIN` (el caso
normal) recibía 403 y no podía renombrar nada. Se arregló en este repo (no hacía falta tocar
`api.evd`, que ya tenía el endpoint correcto): ahora llama a `PATCH /courses/{id}/name`, restringido
al director y a su propio departamento. Por eso la prueba usa una cuenta de un solo rol, creada de
cero, en vez de la cuenta compartida multirol — con `ADMIN` de por medio el bug habría quedado
invisible.

`cypress/e2e/evaluations/pdf-extraction.cy.ts`

- Un director sube el PDF real de evaluación y, tras esperar (sondeando `GET /evaluations/{id}`) a
  que el procesamiento en segundo plano termine, comprueba lo que produjo: el docente aparece en
  `GET /evaluations/period/{period_id}/teachers`, y su detalle
  (`GET /evaluations/teachers/{teacher_id}/detail`) trae, por cada curso (materia + grupo) que
  dictó, sus 4 dimensiones con las 22 preguntas — sin repetirse — y el puntaje de cada una.
- Los comentarios de los estudiantes (`GET /evaluations/{evaluation_id}/teachers/{teacher_id}/comments`)
  ya traen su texto extraído aunque el análisis de IA (`ai_status`) siga `PENDING`: la extracción no
  depende de esa clasificación posterior.

Como `academic-groups.cy.ts` y `upload.cy.ts`, no hay pantalla que "haga" esta extracción — es el
resultado del procesamiento del PDF — así que la prueba se queda en la capa de API. Comparte el
departamento fijo `99` y el mismo residuo entre corridas (profesores, cursos y grupos que el
procesamiento deja y no se pueden borrar en bloque); solo limpia la evaluación que ella misma crea y
su cuenta de director.

`cypress/e2e/evaluations/processing-status.cy.ts`

- Subir un PDF responde `202` con la evaluación ya creada pero en `status: "PROCESSING"` — el
  procesamiento se ejecuta en segundo plano, no bloquea la respuesta.
- El canal de progreso en tiempo real (`GET /ws/evaluations/{id}`, un WebSocket, la vía rápida que usa
  `useEvaluationLogsStore`) recibe eventos mientras la tarea corre, y el último trae el estado final:
  `stage: "UPLOADING"`, `status: "COMPLETED"`. Ese mismo estado es el que después confirma
  `GET /evaluations/{id}` — las dos vías de reporte (WebSocket en vivo, sondeo de respaldo) concuerdan.

Como `upload.cy.ts` y `pdf-extraction.cy.ts`, no hay pantalla propia para "el procesamiento" — es lo
que pasa tras subir un PDF — así que la prueba se queda en la capa de API, con un añadido: el backend
no reproduce eventos para un cliente que se conecta tarde a ese WebSocket, y el procesamiento de este
PDF termina en menos de un segundo, así que un comando normal de Cypress (que pierde tiempo yendo y
viniendo entre el navegador y el proceso de Cypress) llega tarde a la carrera. La subida y la escucha
del WebSocket corren juntas en un solo `cy.task` (`uploadAndWatchProgress`, en `cypress.config.ts`),
que abre el socket desde Node en el instante en que llega el `202` — con el `WebSocket` global de Node
20, sin añadir el paquete `ws`.

`FAILED`, verificado y no forzado: el único punto donde el procesamiento en segundo plano pone
`status: "FAILED"` es si el periodo o el departamento no existen tras parsear el PDF — pero
`prepare_upload` (en `api.evd`) ya crea el periodo y valida el departamento _antes_ de programar esa
tarea, así que esa rama es inalcanzable con cualquier PDF, dañado o no: uno dañado nunca llega a esa
tarea, porque el parseo (síncrono) responde `400`/`422` antes de programarla. No se fabricó un PDF
para forzar esa rama porque, tal como está el código, no hay entrada que la alcance.

`cypress/e2e/evaluations/pdf-download.cy.ts`

- Un director de otro departamento pide el PDF y recibe `403`, por la API y por la interfaz
  (`/evaluaciones/:id/pdf` muestra "No tiene permiso para ver este documento.", no un PDF).
- El director del departamento de la evaluación lo descarga por la API (`200`) y la interfaz lo
  muestra incrustado en esa misma ruta.
- Sin token, `401`; el archivo guardado en disco, pedido directamente por su ruta
  (`uploads/evaluations/...`), responde `404` — no hay `StaticFiles` montado en `api.evd` que lo
  sirva como contenido estático, así que la única vía es el endpoint autenticado.

`cypress/e2e/evaluations/ai-analysis.cy.ts`

- Un director sube el PDF real de evaluación y, ya `COMPLETED`, entra a `/evaluaciones/:id` y hace
  clic en "Analizar" (el mismo disparador que "Analizar con IA" en el listado): el badge de
  "Análisis con IA" pasa de "Pendiente" a "Completado" solo, sin que la prueba sondee la API — el
  análisis corre en segundo plano (`POST /evaluations/{id}/analyze`, `BackgroundTasks`) y reporta
  por el mismo canal WebSocket que ya usa la subida del PDF, así que la app invalida la consulta y
  refresca el badge cuando termina.
- Confirma por API que cada comentario de la evaluación quedó con nivel de riesgo, su puntaje y el
  modelo de HuggingFace local que lo asignó, y que al menos uno tiene categoría pedagógica con su
  propio modelo — los dos pipelines de `api/utils/ai_analyzer.py` (`transformers`, modelos cargados
  una sola vez y reutilizados, no un servicio externo) corrieron de verdad.

A diferencia de las demás pruebas de evaluaciones, esta no da de alta una cuenta de Firebase nueva:
el self-signup está deshabilitado en el proyecto (`accounts:signUp` responde
`400 ADMIN_ONLY_OPERATION`), así que reutiliza una directora ya existente — cualquier cuenta que otra
prueba haya creado y dejado inactiva y sin departamento en su `after()` — la promueve temporalmente
al departamento `99` que exige el PDF, y al terminar la deja como la encontró. Si el entorno no tiene
ninguna (recién sembrado, sin residuo de otras pruebas), falla con un mensaje explícito en vez de
intentar darla de alta.

Al preparar esta prueba apareció una evaluación huérfana en el departamento `99` (periodo `2025-2`,
de una corrida anterior sin limpiar) que bloqueaba la subida con `409`; se borró a mano antes de
correr el spec — ver _Fallos que estas pruebas destaparon_ para el bug de roles que además destapó
esa misma limpieza.

`cypress/e2e/evaluations/comments.cy.ts`

- Un director filtra, en `/comentarios`, los comentarios de su departamento por periodo (URL
  `?period=`) y por docente (combobox "Docente"): el listado y su paginación coinciden con lo que
  `GET /comments/` reporta para ese mismo filtro.
- El conteo por departamento y periodo (`GET /comments/count`) y por docente y periodo
  (`GET /comments/teacher-count`) coincide con el total que el propio listado filtrado reporta —
  comprobado contra ese total, no contra un número fijo, para no depender de cuántos comentarios
  trae exactamente el PDF de pruebas.
- El conteo por departamento aísla en silencio (como `GET /comments/`): el de un director de otro
  departamento siempre resuelve contra su propio `department_id`, nunca el ajeno.

Ninguno de los dos conteos tiene pantalla propia — nada en el frontend consume esos dos endpoints —
así que esa mitad de la prueba se queda en la capa de API, como el resumen y los promedios por
dimensión de `security/evaluation-access.cy.ts`. El fixture es el mismo PDF real de
`upload.cy.ts`/`pdf-extraction.cy.ts` (departamento fijo `99`, periodo `2025-2`), subido por un
director recién creado; un segundo director, de un departamento real distinto, prueba el
aislamiento. Mismo residuo entre corridas que esos specs (profesores/cursos/grupos que el
procesamiento deja); esta prueba solo limpia la evaluación que crea y las dos cuentas de director.

Arreglado, y es del backend — `GET /comments/teacher-count` no tenía ningún control de acceso.
Verificado contra el servidor real antes de escribir esta prueba: la ruta dependía solo de
`get_current_user`, sin `require_roles` ni comprobación de departamento, así que cualquier
autenticado (probado con una cuenta de solo `DOCENTE`) podía pedir el conteo de comentarios de
cualquier docente de cualquier departamento con solo su `teacher_id` — a diferencia de
`GET /comments/` y `GET /comments/count`, los otros dos endpoints del mismo router, que sí exigen
`DIRECTOR DE DEPARTAMENTO` y se acotan al departamento propio de quien llama. Se corrigió en
`api.evd` (`count_comments_by_teacher_and_period`, en `api/routes/comments.py`): ahora exige ese
mismo rol y compara el departamento del docente contra el del director que llama, el mismo patrón
que ya usa `EvaluationService._assert_can_view_department`. Verificado con la suite de `api.evd` y
de nuevo contra el servidor real (un director de otro departamento recibe `403`, no el conteo).

`cypress/e2e/evaluations/comment-classification.cy.ts`

- Un director corrige, desde `/comentarios`, el nivel de riesgo y la categoría pedagógica de un
  comentario recién extraído del PDF y sin clasificar todavía (`risk_level: null`,
  `pedagogical_categories: []`) — el popover "Editar clasificación" que cuelga de cada tarjeta
  cuando quien mira opera como director (`PATCH /comments/{comment_id}`).
- Lo guardado coincide con lo que muestra la interfaz: el nivel y la categoría elegidos, el puntaje
  de certeza en `1` (una decisión humana, no una estimación de IA), sin modelo de IA asociado, y las
  dos marcas de "modificado por el director".
- Un director de otro departamento recibe `403` al intentar la misma corrección, y el comentario
  sigue con la clasificación que puso el dueño, no la que intentó el de afuera.

El comentario objetivo se elige por API (`GET /comments/` sin más filtro que el periodo, la misma
consulta que hace `CommentsList` al entrar a la página), no por su texto ni por su posición en el
DOM — así la prueba no depende de qué trae exactamente el PDF ni de en qué página cae un comentario
elegido al azar. Verificado contra el servidor real antes de escribir el spec: no apareció ningún
bug, el aislamiento por departamento ya funcionaba. Mismo fixture y mismo residuo entre corridas que
`evaluations/comments.cy.ts` (PDF real, departamento fijo `99`, profesores/cursos/grupos que el
procesamiento deja); esta prueba solo limpia la evaluación que crea y las dos cuentas de director.

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

`cypress/e2e/security/department-isolation.cy.ts`

- Un director asignado de verdad a un departamento (vía `POST /departments/{id}/director`, no solo
  con `department_id` en su usuario) accede al historial de un docente de su propio departamento.
- Pedir el historial de un docente de otro departamento responde `403`, no un `200` con datos vacíos:
  el listado de docentes (`GET /teachers/`) sí resuelve el aislamiento sustituyendo en silencio el
  `department_id` de la consulta por el del director, pero el detalle por ID no tiene ese filtro que
  aplicar — sin la comprobación explícita, un director vería el historial de cualquier docente de la
  universidad. Los dos docentes de la prueba y la asignación de director se crean y se limpian solos,
  sin dejar nada detrás.

`cypress/e2e/security/evaluation-access.cy.ts`

- El director dueño consulta su propia evaluación por identificador, por periodo, en el listado
  paginado, su resumen, sus promedios por dimensión y su detalle por dimensión — los 6 endpoints que
  cubre el RF, los 6 en `200`.
- Un director de otro departamento recibe `403` en 5 de esos 6 (por identificador, por periodo, el
  resumen, los promedios por dimensión y el detalle por dimensión) — no un `200` con los datos de una
  evaluación ajena.
- El sexto, el listado paginado, aísla distinto: no hace falta un `403` porque `GET /evaluations/`
  sustituye en silencio el `department_id` de la consulta por el del director (como `GET /teachers/`
  en `department-isolation.cy.ts`), así que la evaluación ajena simplemente no aparece en la página
  del director de otro departamento.

Arreglado — 4 de esos 6 endpoints no comprobaban el departamento en absoluto (`api.evd`). Al
verificar el RF contra el servidor real con dos directores de departamentos distintos apareció un
director cualquiera viendo, con `200` y los datos completos, la evaluación de OTRO departamento por
`GET /evaluations/{id}`, `GET /evaluations/by-period/{id}`, `GET /evaluations/{id}/summary` y
`GET /evaluations/{id}/dimension-averages` — ninguno de los cuatro comprobaba el departamento del
llamador contra el de la evaluación, solo el rol. Solo `GET /evaluations/{id}/dimensions/detail` ya
tenía esa comprobación. Se corrigió en `api.evd`
(`EvaluationService._assert_can_view_department`, la misma regla que ya usaba `get_dimension_detail`
— ADMIN o el director del departamento de la evaluación — aplicada también a los otros cuatro),
verificado con la suite de `api.evd` (1737 tests) y de nuevo contra el servidor real antes de escribir
esta prueba. No hay pantalla propia para el resumen ni para los promedios por dimensión (el frontend
no los consume), así que la prueba se queda en la capa de API, como `department-isolation.cy.ts`. La
evaluación de fixture es un PDF real subido por el director dueño (departamento fijo `99`, ver
`upload.cy.ts`); el director ajeno es de un departamento real distinto. Los dos directores y la
evaluación se crean y se limpian solos.

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

## Fallos que estas pruebas destaparon

**Arreglado — un departamento sin director no se podía eliminar (`api.evd`).** Al preparar
`admin/departments.cy.ts` apareció un departamento imposible de borrar tras asignarle un director y
luego retirarlo, aunque `GET /departments/{id}` ya mostraba `director: null`. Tres capas del mismo
descuido en `api/repositories/departments.py` y `api/repositories/directors.py`:

1. `has_active_director` contaba cualquier fila de `directors` para ese departamento, sin filtrar por
   `active`, así que un director ya retirado (`active=False`, la fila no se borra, solo se desactiva)
   seguía bloqueando el borrado para siempre.
2. Al corregir eso, `assign_director` dejaba pasar la reasignación de un ex-director a otro
   departamento pero el `INSERT` violaba la restricción única de `directors.user_id` — esa fila
   inactiva seguía ahí. Se corrigió reutilizando la fila existente del usuario (o la del
   departamento) en vez de intentar crear una nueva, igual que ya hacía el código para el caso
   simétrico por `department_id`.
3. Incluso con eso, borrar el departamento seguía fallando: la fila inactiva del director conserva su
   `department_id` y hay una FK dura hacia `departments`. `delete_department` ahora borra esa fila
   (ya se validó que no hay director activo) antes de borrar el departamento.

Las tres correcciones están en `api.evd`, verificadas con su suite de tests y contra el stack real
antes de escribir el spec. Quedaron superadas por el siguiente cambio: `unassign_director` pasó de
desactivar la fila a borrarla, así que ya no hay fila inactiva que limpiar ni FK que violar — ver
abajo.

**Cambiado — desasignar un director ahora borra la fila, no la desactiva (`api.evd`).** Con el
esquema anterior (`active=False`), un director retirado seguía apareciendo en `/admin/directores`
como "Inactivo" pero con su departamento de siempre en la columna correspondiente — como si aún lo
dirigiera, solo que inactivo. `unassign_director` ahora hace lo mismo que "Eliminar" en esa pantalla:
borra la fila de `directors` de verdad. Dos consecuencias:

- El rol `DIRECTOR DE DEPARTAMENTO` del usuario también se retira al desasignar (mirror de que
  `assign_director` ya lo añadía) — salvo que fuera su único rol, porque `UserUpdate.roles` exige al
  menos uno.
- El filtro "Inactivo" y la acción "Eliminar" de `/admin/directores` quedan sin nada que mostrar en el
  flujo normal (una fila ya no puede quedar inactiva) — no se tocó esa pantalla, es candidata a
  simplificar más adelante.

**Arreglado — la edición de usuarios no llegaba a la API.** `useUpdateUser` hacía
`PUT /users/{id}` con el id numérico, una ruta que la API no tiene: respondía
`405 Method Not Allowed` y la interfaz mostraba ese texto como error al guardar. Ahora usa las dos
rutas que sí existen, `PUT /users/{uid}/roles` y `PATCH /users/{uid}/status`, direccionadas por el
`uid` de Firebase. De paso, el formulario de edición dejó de ofrecer nombre y avatar: la API no tiene
ninguna ruta para cambiarlos en otro usuario, así que esos campos solo podían tirar lo escrito.

**Arreglado — renombrar una materia daba 403 a un director real.** `useUpdateCourse` llamaba a
`PUT /courses/{id}`, restringido a `ADMIN` en la API. Las dos pantallas que lo usan
(`EvaluationCoursesReview` en `/evaluaciones/:id/materias` y `SubjectsList` en `/materias`) están
restringidas a `DIRECTOR DE DEPARTAMENTO` en `security.ts` — un director real que no fuera también
`ADMIN` (el caso normal) recibía 403 al intentar renombrar. La API ya tenía el endpoint correcto,
`PATCH /courses/{id}/name`, restringido al director y a su propio departamento; el frontend
simplemente no lo usaba. Ahora `updateCourse()` llama a ese, y ambas pantallas quedaron corregidas
con un solo cambio.

**Arreglado, y es del backend — eliminar un director desde `/admin/directores` no le quitaba el
rol.** `DELETE /directors/{id}` borraba la fila pero nunca retiraba `DIRECTOR DE DEPARTAMENTO` del
usuario, a diferencia de `DELETE /departments/{id}/director` (el otro camino de borrado), que sí lo
hacía. El propio comentario del código de ese segundo camino decía que retirar el rol "ya era trabajo
de `DirectorService.delete`" — pero `delete()` nunca lo hizo. Un director eliminado desde esta
pantalla se quedaba viendo el menú y las rutas de director para siempre, sin ningún departamento a
cargo. Se corrigió compartiendo la lógica entre los dos métodos (`_retire_director_role`, en
`api.evd`).

**Pendiente, a pedido del usuario — `GET /directors/` no busca por código institucional.** La columna
"Código" de `/admin/directores` muestra el `institutional_code` del director, y el tipo
`DirectorParams` del frontend documenta que la búsqueda lo cubre — pero `DirectorsRepository.search`
solo filtra por nombre, correo y nombre/código del departamento. No bloquea el RF (buscar por nombre o
correo funciona), así que se dejó tal cual; `admin/directors.cy.ts` busca por nombre por esta razón.

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

**Pendiente, y es del backend — `PUT /users/{uid}/roles` le regala ADMIN a cualquier usuario que un
admin edite, no solo cuando el objetivo ya era admin.** Descubierto preparando
`ai-analysis.cy.ts`: `UserService.replace_roles` añade `RoleName.ADMIN` a la lista de roles
_siempre que el llamador (`requester_roles`) sea admin_, sin comprobar si el usuario objetivo lo era.
Es más amplio que el bug de arriba (que solo describe que ADMIN no se puede _quitar_ de una cuenta
que ya lo tenía): aquí una llamada tan inocente como "reemplaza los roles de este docente por
`['DOCENTE']`", hecha por cualquier admin, dejaría a ese docente también como ADMIN. Se disparó sin
querer al limpiar el fixture de `ai-analysis.cy.ts` (una restauración de roles que ya no hace falta,
ver ese spec) y, combinado con el bug de arriba, dejó una cuenta de prueba
(`e2e-analisis-1788833038229@ufps.edu.co`, id `355`) con `ADMIN` pegado para siempre — inofensiva
(es una cuenta desechable más, como la que deja `admin/users.cy.ts`), pero ya no sirve como director
de pruebas: `ai-analysis.cy.ts` la excluye sola de sus candidatos porque busca por
`roles=DIRECTOR DE DEPARTAMENTO`, que esta cuenta ya no tiene. No se arregló a pedido del usuario; el
arreglo va en `api.evd` (`UserService.replace_roles`), no aquí.

**Arreglado, y es del backend — 4 de las 6 formas de consultar una evaluación no aislaban por
departamento.** `GET /evaluations/{id}`, `GET /evaluations/by-period/{id}`,
`GET /evaluations/{id}/summary` y `GET /evaluations/{id}/dimension-averages` solo comprobaban el rol
(`ADMIN` o `DIRECTOR DE DEPARTAMENTO`), no si la evaluación pedida era del departamento del director
que llamaba: un director cualquiera veía, con `200` y los datos completos, la evaluación de otro
departamento. Solo `GET /evaluations/{id}/dimensions/detail` ya tenía la comprobación correcta
(`director.department_id == evaluation.department_id`). Se corrigió aplicando esa misma regla a los
otros cuatro (`EvaluationService._assert_can_view_department`, en `api.evd`), verificado con la suite
de `api.evd` y con `security/evaluation-access.cy.ts`.

**Arreglado, y es del backend — `GET /comments/teacher-count` no tenía ningún control de acceso.**
Al preparar `evaluations/comments.cy.ts` apareció que esta ruta dependía solo de
`get_current_user`, sin `require_roles` ni comprobación de departamento — a diferencia de
`GET /comments/` y `GET /comments/count`, los otros dos endpoints del mismo router, que sí exigen
`DIRECTOR DE DEPARTAMENTO` y se acotan al departamento propio de quien llama. Cualquier autenticado
(probado con una cuenta de solo `DOCENTE`) podía pedir el conteo de comentarios de cualquier
docente de cualquier departamento con solo su `teacher_id`. Se corrigió en `api.evd`
(`count_comments_by_teacher_and_period`, en `api/routes/comments.py`): ahora exige el rol
`DIRECTOR DE DEPARTAMENTO` y compara el departamento del docente contra el del director que llama,
el mismo patrón que ya usa `EvaluationService._assert_can_view_department`.

## Lo que no cubren

La ventana de consentimiento de Google es de un tercero y Cypress no puede conducirla, así que del
flujo de Google se prueba lo que es nuestro: que el botón lo arranca contra el proveedor y el
proyecto correctos. La sesión posterior al consentimiento no es automatizable sin mockear Firebase,
que es exactamente lo que estas pruebas evitan.

El «token vencido» se fabrica como un JWT caducado y sin firma válida: sin la clave privada de Google
no se puede producir uno auténtico ya expirado. El backend lo rechaza igual.
