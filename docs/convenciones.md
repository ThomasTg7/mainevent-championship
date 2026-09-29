# Convenciones establecidas (Plan 00)

Patrones que ya existen en el código. Los planes 01–07 los heredan: **úsalos en vez de reinventarlos**. Si un plan dice algo distinto, manda lo de aquí y se anota en `docs/decisions.md`.

## Server actions y lógica testeable

- La lógica va en funciones que reciben `db` (y `auth` si hace falta): `(db, input, actorId)`. Se testean con PGlite (`createTestDb()` de `@/test/db`). Ejemplos: `inviteAdmin`, `createAdminWithPassword` en `src/features/admin-users/accounts.ts`, `createTrash()` en `src/features/trash/trash.ts`.
- `actions.ts` queda delgado: `requireAdmin()` → `schema.safeParse` (Zod) → llamar la función → `logAudit` → `revalidatePath`/`revalidateTag`. Devuelve `{ error?: string; success?: string }` (mensajes en español, listos para toast/inline). No se testea directo (usa `headers()`); lo cubren los e2e.
- **Toda página** del admin llama `await requireAdmin()` (no basta el layout: no se re-ejecuta al navegar). Está cacheado por request (`getAdmin()` en `src/lib/require-admin.ts`), así que es gratis repetirlo.
- Para leer la sesión sin redirigir (p. ej. "si ya está logueado, anda al panel"): `getAdmin()`.

## Auth (Better Auth)

- Instancia: `auth` en `src/lib/auth.ts`, construida con `createAuth({ db, mailer, google? })` (`src/lib/create-auth.ts`). Para tests de integración: `createTestAuth(db, mailer)` y `createRecordingMailer()` de `@/test/auth`.
- **No hay registro público** (`disableSignUp`). Admins entran por invitación (`inviteAdmin`), Google o `pnpm tsx scripts/create-admin.ts <email> <clave>`.
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
- Verificación completa: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e`, `pnpm build`.
