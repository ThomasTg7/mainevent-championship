# Convenciones establecidas (Plan 00)

Patrones que ya existen en el código. Los planes 01–07 los heredan: **úsalos en vez de reinventarlos**. Si un plan dice algo distinto, manda lo de aquí y se anota en `docs/decisions.md`.

## Server actions y lógica testeable

- La lógica va en funciones que reciben `db` (y `auth` si hace falta): `(db, input, actorId)`. Se testean con PGlite (`createTestDb()` de `@/test/db`). Ejemplos: `inviteAdmin`, `createAdminWithPassword` en `src/features/admin-users/accounts.ts`, `createTrash()` en `src/features/trash/trash.ts`.
- `actions.ts` queda delgado: `requireAdmin()` → `schema.safeParse` (Zod) → llamar la función → `logAudit` → `revalidatePath` (panel) / `updateTag` (caché pública; ver la sección del Plan 02: nunca `revalidateTag(…, "max")`). Devuelve `{ error?: string; success?: string }` (mensajes en español, listos para toast/inline). No se testea directo (usa `headers()`); lo cubren los e2e.
- **Toda página** del admin llama `await requireAdmin()` (no basta el layout: no se re-ejecuta al navegar). Está cacheado por request (`getAdmin()` en `src/lib/require-admin.ts`), así que es gratis repetirlo.
- Para leer la sesión sin redirigir (p. ej. "si ya está logueado, anda al panel"): `getAdmin()`.

## Auth (Better Auth)

- Instancia: `auth` en `src/lib/auth.ts`, construida con `createAuth({ db, mailer, google? })` (`src/lib/create-auth.ts`). Para tests de integración: `createTestAuth(db, mailer)` y `createRecordingMailer()` de `@/test/auth`.
- **No hay registro público** (`disableSignUp`). Admins entran por invitación (`inviteAdmin`), Google o `pnpm create-admin <email> <clave>`.
- Errores de auth → texto en español con `authErrorMessage()` (`src/features/admin-users/auth-errors.ts`). El rechazo por lista blanca viaja como código `EMAIL_NOT_ALLOWED`.
- Google aparece solo si `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` existen (`googleSignInEnabled`).

## Correo

- `getMailer()` de `@/lib/mailer`: `send({ to, subject, react })`. `MAIL_DRIVER=console` (dev: imprime el correo y sus enlaces en la terminal) o `resend`. Plantillas en `src/emails/*.tsx` con `@react-email/components`.

## Papelera

- Registrar la entidad en `src/features/trash/registry.ts` (un solo archivo, para que Papelera y el cron la vean siempre):
  `{ type: "fighter", label: "Peleador", table: fighters, title: sql<string>\`${fighters.firstName} || ' ' || ${fighters.lastName}\` }`
- Usar `softDelete(db, type, id, actorId)` / `restore(...)` (auditan solos). La tabla necesita índice en `deleted_at`.
- En tests: `createTrash([...entidades de prueba])`, no el registro global.

## Listados y paginación

- Admin: máximo 50 por página. Query devuelve `{ items|entries, hasMore }` pidiendo `pageSize + 1`. Página desde la URL con `parsePageParam(searchParams.pagina)` (`src/lib/pagination.ts`) y navegación con `<Pagination basePath page hasMore />` (`src/components/admin/pagination.tsx`).
- Tablas del admin: `<Table className="hidden sm:table">` + lista de tarjetas `sm:hidden` para móvil (ver `allowed-emails-list.tsx`, `audit-log-list.tsx`).
- Estados: `loading.tsx` (skeleton) y `error.tsx` ya existen para `(protected)`; cada listado muestra un vacío con texto útil.

## Fechas

- Siempre `formatDate` / `formatDateTime` de `src/lib/format-date.ts` (es-CL, zona `America/Santiago` fija). Nunca `Intl.DateTimeFormat` suelto ni `toLocaleDateString` (desfase servidor/cliente → error de hidratación).

## UI

- Admin: componentes shadcn en `src/components/ui` (tema oscuro GC, `--radius: 0`). Campos con `<FormField id label error hint>` (`src/components/admin/form-field.tsx`): etiqueta visible, error con `role="alert"` junto al campo; el input lleva `aria-invalid` y `aria-describedby={formFieldErrorId(id)}`.
- El componente `form` de shadcn **no existe** en esta versión: formularios con `<form action={...}>`/`useActionState` o `onSubmit` y validación Zod en el servidor.
- Objetivos táctiles de 44 px: los da `globals.css` por `data-slot` en pantallas táctiles; no achicar con clases.
- Colores de texto secundario: `text-muted-foreground` (no existe `text-muted`).
- Sitio público: botones `@/components/ui-gc/button` (primary/ghost/dark), `Logo`, `Flag` (ya tiene nombre accesible del país), `SectionHeading`, `Tag`. Links de navegación en `src/components/site/nav-links.ts`.
- Animaciones solo con `transform`/`opacity`; `prefers-reduced-motion` ya se respeta globalmente, y en JS con `useReducedMotion()`.
- Si `shadcn add ... -o` regenera `src/hooks/use-mobile.ts`, reaplicar el fix con `useSyncExternalStore` (ver decisions.md).

## Tests

- `*.test.tsx` que necesitan DOM: primera línea `// @vitest-environment jsdom`.
- Integración con BD: `createTestDb()` (clon de una plantilla PGlite ya migrada; rápido). Tablas de prueba temporales con `create temporary table`.
- E2E: BD propia `guerra_campal_e2e` (se vacía en cada corrida, requiere Docker). Login con `signInAsAdmin(page)` de `e2e/fixtures/admin.ts`. Locators de alertas por texto (Next agrega su propio `role="alert"`).
- E2E y build usan carpeta propia (`E2E_DIST_DIR=.next-e2e`, ya fijada por `playwright.config.ts`): corren aunque haya un `pnpm dev` abierto. Para construir sin tocar el `.next` del dev: `E2E_DIST_DIR=.next-e2e pnpm build`.
- Verificación completa: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e`, `pnpm build`.

## Imágenes (Plan 01)

- **Subir/editar en formularios:** `<MediaField kind name media? onChange? />` y `<MediaGalleryField name media? />` (`src/features/media/components`). Envían el id (uno por foto en galería) como `<input type="hidden" name>`; la action del formulario solo guarda el id. Pasar `media` (DTO ya guardado) para mostrar la miniatura al editar.
- **Leer:** `getMedia(db, id)` / `getMediaByIds(db, ids)` (una consulta; solo imágenes `ready`). Patrón en listados y fichas: leer las entidades, juntar **todos** los ids de imagen de la página y hacer **una** `getMediaByIds`. Nunca una consulta por imagen.
- **Mostrar:** siempre `<MediaImage media sizes priority? className />` (`src/components/media`): `srcset` de variantes WebP, `width`/`height` del resultado (reserva espacio, sin CLS) y `object-position` del punto de enfoque. `sizes` es obligatorio; `priority` solo para la imagen LCP. Los logos SVG no tienen variantes (usa `originalUrl`, ya sanitizado). Logos de patrocinador: enteros dentro de una caja `aspect-[2/1]` con `object-contain` (`MEDIA_SPECS.sponsor_logo.box`).
- **Caché:** una lectura pública cacheada que devuelve imágenes agrega, además del tag de su entidad, `mediaCacheTag(id)` (`src/features/media/cache.ts`) de cada imagen: al reeditar una imagen se borran sus variantes viejas y `saveMediaEditAction` invalida ese tag.
- **Referencias (quién usa una imagen):** FK `references media(id) on delete restrict` con índice, registrada en `src/features/media/references.ts` (`MEDIA_REFERENCES`; lo crea el Plan 02). Quitar/reemplazar una imagen solo cambia el id; la papelera no toca imágenes; el cron borra las `ready` sin referencias con más de 7 días. Las actions validan los ids con `assertUsableMedia`. Detalle en `docs/decisions.md` → "Dueños de las imágenes".
- **Formatos por tipo:** `MEDIA_SPECS` en `src/domain/media-specs.ts` (aspecto o caja, mínimo, variantes). No repetir esas cifras en otro lado. Tope de 15 MB y 50 MP por archivo.
- **Almacenamiento:** `getStorage()` (`STORAGE_DRIVER=local|s3`); claves de variantes las genera `saveMediaEdit`, no armarlas a mano. Las URLs de subida son de un solo uso (409 local, `If-None-Match: *` en S3).
- **Diálogos del editor:** `EditorDialog` recibe `returnFocusTo` (el contenedor del campo) y los botones "Editar" llevan `mediaTriggerAttribute(id)` para devolverles el foco al cerrar.
- **Página de pruebas** (solo desarrollo): `/admin/medios`.

## Peleadores, divisiones, publicación y caché pública (Plan 02)

- **Servicios:** `features/<dominio>/service.ts` con `(db, input, actorId)`; audita dentro y lanza `UserFacingError` (mensaje en español); tests en `service.test.ts` con PGlite. `actions.ts` solo hace `requireAdmin()`, valida (ids incluidos; `zodFieldErrors` para errores por campo), llama al servicio y expira cachés. Las lecturas (también la de una action, como el slug para la vista previa) van en `queries.ts`. Formularios: `FormActionState` (`src/lib/form-errors.ts`); `formValues(formData)` para devolver lo escrito.
- **Formularios grandes:** `onSubmit` + `startTransition(() => formAction(formData))` (no `<form action>`, que vacía los campos), `noValidate`, pestañas montadas y ocultas (`forceMount` + `hidden`), primera pestaña con error se abre sola, botón principal `sticky bottom-0` en celular. Selectores largos: `NativeSelect`. Nombres de país y cualquier `Intl` que dé texto: en el servidor, pasados por props (hidratación).
- **Publicación:** `publicationShape` + `requireScheduleDate` + `normalizePublishAt` (Zod), `PublicationControls` + `PublicationBadge` + `isPublicationValid`, `src/lib/santiago-time.ts` para fecha y hora en Chile. Vista previa: `createPreviewToken/verifyPreviewToken(token, { entity, id })` y `?preview=<token>` en la URL pública; el peleador es el ejemplo (`createFighterPreviewLinkAction`).
- **Caché pública:** `unstable_cache` en `cached-queries.ts` de cada dominio. Listados: tag de la lista + `divisions` + `media`. Fichas: primero una lectura mínima sin caché que decide si es público ahora; luego caché con `fighter:<id>`, `divisions` y `media:<id>`. Toda action que escribe llama `revalidateFighter(id)`-equivalente con **`updateTag`** (inmediato; `revalidateTag(…, "max")` sirve contenido viejo una vez). Cada entidad de la papelera declara `revalidate(id)` en `registry.ts` (se llama al restaurar).
- **Imágenes:** toda FK a `media.id` va en `MEDIA_REFERENCES` (test lo exige); las actions validan con `assertUsableMedia`; cron `purgeUnreferencedMedia` a los 7 días.
- **Componentes reutilizables:** `CountFigures` (cifras con contador), `FighterSilhouette` (sin foto), `Pagination` con `params`, `Tag` con tono `outline`.
- **Errores en actions:** `runUserFacing(logLabel, task, fallback?)` (`src/lib/user-facing-error.ts`) devuelve `{ value } | { error }`: un `UserFacingError` (y sus subclases, como `MediaError`) llega tal cual; cualquier otro error queda en el log y la persona ve un mensaje genérico. No escribir otro `try/catch` igual. La papelera lanza `UserFacingError` solo para «no existe / ya estaba»; los servicios no convierten cualquier error en «no se encontró».
- **Ids:** toda action y página del panel que recibe un id lo valida con Zod (`z.uuid()`, p. ej. `fighterIdSchema`) antes de consultar; inválido → `notFound()` o `{ error: "No se encontró…" }`. `src/app/admin/(protected)/not-found.tsx` muestra el «no encontrado» en español (el panel transmite por partes: el código HTTP queda en 200, los e2e miran el texto).
- **«Hoy» en Chile:** `santiagoToday()` (mediodía UTC del día de Santiago) para edades y comparaciones de día; `toSantiagoInputs(now).date` si se necesita el texto `YYYY-MM-DD`. Nunca `new Date()` como «hoy» en una comparación de días.
- **`unstable_cache` serializa en JSON:** lo cacheado no puede traer `Date` (vuelve como texto). Los DTO cacheados llevan fechas ISO; si una función pura necesita `Date` (p. ej. `computeRecord`), se ejecuta dentro de la función cacheada.
- **Búsquedas de texto** (`?q=`) no pasan por `unstable_cache`: cada texto sería una entrada de un solo uso.
- **Vista previa:** verificar la firma del token (`verifyPreviewToken(token)`) antes de leer el borrador; luego verificar que sea de esa entidad e id.
- **Pestañas que se envuelven en celular:** `TabsList` de shadcn fija `group-data-horizontal/tabs:h-8`, que gana a `h-auto`; agregar `group-data-horizontal/tabs:h-auto` o la 2.ª fila tapa el contenido.
- **Interruptores (`Switch`):** miden 18 px; envolverlos en una `<label className="flex min-h-11 …">` con texto para que el área táctil sea de 44 px.
- **Tests e2e en paralelo:** datos propios por spec; los del sitio público dependen del seed y ninguna prueba del panel modifica esos peleadores; esperar el aviso «guardado» antes de recargar tras cambios optimistas.

## Panel en su subdominio (después del Plan 02)

- **Dominios:** sitio en `SITE_URL` (`guerracampal.cl`; dev `localhost:3000`) y panel en `ADMIN_URL` (`admin.guerracampal.cl`; dev `admin.localhost:3000`). `src/lib/site-urls.ts` (`siteOrigin`, `adminOrigin`, `publicUrl`, `adminPath`) y `src/lib/admin-routing.ts` (`routeByHost`, testeado) + `src/proxy.ts`. En producción ambas variables son obligatorias.
- **Rutas del panel:** los archivos siguen en `src/app/admin/...`, pero en el navegador no llevan `/admin`: `admin.guerracampal.cl/peleadores`. En enlaces, `router.push`/`replace`, `redirect()` de páginas y `basePath` de `Pagination`, usar siempre `adminPath("/peleadores")`; nunca escribir `"/admin/..."`. `revalidatePath` y `PageProps<"/admin/...">` sí usan la ruta de la carpeta (`/admin/peleadores`). En los planes, `/admin/x` indica la carpeta; la URL real es `admin.<dominio>/x`.
- **Sin `redirect()` dentro de server actions:** Next lo resuelve por dentro sin pasar por el proxy y caería en una página del sitio. La action devuelve `redirectTo` (`FormActionState`) y el cliente hace `router.replace(result.redirectTo)` (ejemplo: `createFighterAction` + `FighterForm`). `requireAdmin()` ya maneja la sesión vencida dentro de una action.
- **Enlaces del panel al sitio** (vista previa, «ver en el sitio»): absolutos con `publicUrl(path)`; el sitio no se sirve en el subdominio del panel.
- **Better Auth** usa `ADMIN_URL` como `baseURL`: sesión, Google y enlaces de correo van al panel; la cookie de sesión nunca llega al sitio público.
- **E2E:** `adminUrl("/peleadores")` de `e2e/fixtures/admin.ts` para todo lo del panel (`playwright.config.ts` fija `SITE_URL`/`ADMIN_URL` al puerto 3100); lo público sigue con rutas relativas.
