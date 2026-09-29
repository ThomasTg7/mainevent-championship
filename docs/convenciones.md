# Convenciones establecidas (Plan 00)

Patrones que ya existen en el código. Los planes 01–07 los heredan: **úsalos en vez de reinventarlos**. Si un plan dice algo distinto, manda lo de aquí y se anota en `docs/decisions.md`.

## Server actions y lógica testeable

- La lógica va en funciones que reciben `db` (y `auth` si hace falta): `(db, input, actorId)`. Se testean con PGlite (`createTestDb()` de `@/test/db`). Ejemplos: `inviteAdmin`, `createAdminWithPassword` en `src/features/admin-users/accounts.ts`, `createTrash()` en `src/features/trash/trash.ts`.
- `actions.ts` queda delgado: `requireAdmin()` → `schema.safeParse` (Zod) → llamar la función → `logAudit` → `revalidatePath`/`revalidateTag`. Devuelve `{ error?: string; success?: string }` (mensajes en español, listos para toast/inline). No se testea directo (usa `headers()`); lo cubren los e2e.
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
