# Registro de decisiones

Toda desviación del spec o de un plan, decisión técnica no prevista, o pendiente, se anota aquí. Lo lee la revisión (Opus) al terminar cada plan y lo usa para ajustar los planes siguientes.

Formato:

```
## [Plan NN · Task N] Título corto — YYYY-MM-DD
- **Qué:** qué se hizo distinto o se decidió.
- **Por qué:** motivo concreto.
- **Impacto:** archivos/interfaces afectados y planes siguientes que deben ajustarse (o "ninguno").
- **Estado:** aplicado | pendiente | revertido
```

---

## [Plan 00 · Task 1] Ambiente de test por archivo vía pragma, no `environmentMatchGlobs` — 2026-09-28
- **Qué:** Vitest se configura con `environment: 'node'` por defecto; los archivos `*.test.tsx` que necesiten DOM agregan `// @vitest-environment jsdom` como primera línea.
- **Por qué:** Vitest 5 (instalado por el plan) eliminó la opción `environmentMatchGlobs` que el plan asumía; `pnpm build` falla el type-check con ese campo.
- **Impacto:** `vitest.config.ts`. Todo `*.test.tsx` futuro (Task 6 en adelante) debe llevar el pragma `// @vitest-environment jsdom` en la primera línea del archivo.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 5] `DATABASE_URL` de relleno en `src/test/setup.ts` — 2026-09-28
- **Qué:** el setup global de Vitest fija `process.env.DATABASE_URL` a un valor de relleno si no está definida.
- **Por qué:** `src/db/index.ts` lanza al importarse si falta `DATABASE_URL` (por diseño, para fallar rápido en producción). Rutas como `/api/cron/purge` importan el singleton `db` a nivel de módulo para su handler real (`GET`), aunque sus tests unitarios inyectan una base de prueba (PGlite) y nunca tocan `db`. Sin el valor de relleno, el solo hecho de importar el archivo de la ruta rompía el test. `postgres.js` conecta de forma perezosa (recién en la primera consulta), así que el valor de relleno nunca abre una conexión real.
- **Impacto:** `src/test/setup.ts`. Cualquier test futuro que importe (sin ejecutar) un módulo que re-exporta `db` queda cubierto.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 8] `src/lib/cn.ts` pasa a re-exportar el paquete `cn` — 2026-09-28
- **Qué:** `pnpm dlx shadcn@latest init`/`add` generan y regeneran `src/lib/utils.ts` con `export { cn } from "cn"` (paquete oficial de shadcn-ui, "drop-in replacement" de clsx+tailwind-merge) y templan sus componentes (`src/components/ui/*`) importando `cn` directamente desde el paquete `"cn"`, ignorando el alias `aliases.utils` de `components.json` para ese import puntual. Pelear esa convención en cada `shadcn add` de los planes siguientes no es sostenible. En vez de eso, `src/lib/cn.ts` (el helper de Task 1) ahora también re-exporta `cn` desde el paquete `"cn"`; se quitaron `clsx` y `tailwind-merge` (quedaron sin uso). `components.json.aliases.utils` queda en su valor por defecto `"@/lib/utils"`.
- **Qué (más):** también se reescribió `src/app/globals.css` (shadcn dejó `--color-border` duplicado y un tema claro/oscuro con paleta gris) y `src/app/layout.tsx` (shadcn agregó una fuente Geist redundante) para usar solo los tokens de marca Guerra Campal, con `--radius: 0` para mantener los bordes rectos de la identidad visual en todos los componentes shadcn.
- **Por qué:** una sola implementación real de `cn` (el paquete npm), referenciada desde `@/lib/cn` (código propio: Button, Header, Footer, Tag, etc.) y `@/lib/utils` (lo que genera el CLI de shadcn) sin duplicar lógica ni pelear la codegen en cada plan. El tema gris de shadcn y la fuente Geist contradicen el sistema de diseño de Task 6 (negro/amarillo, Anton/Barlow) y el panel admin no tiene modo claro.
- **Impacto:** `src/lib/cn.ts`, `src/lib/utils.ts`, `components.json`, `src/app/globals.css`, `src/app/layout.tsx`, `package.json` (fuera: `clsx`, `tailwind-merge`; dentro: `cn`). Ningún plan siguiente necesita tocar esto: `shadcn add` seguirá funcionando tal cual.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 8] Componente `form` de shadcn omitido (no existe en esta versión) — 2026-09-28
- **Qué:** el plan pedía agregar el componente `form` de shadcn junto a los demás. En shadcn 4.21 (estilo `radix-nova`) ese registro existe pero está vacío (`{"name":"form","type":"registry:ui"}`, sin archivos ni dependencias): la versión nueva no trae el wrapper clásico basado en `react-hook-form` + `zodResolver`. No se agrega.
- **Por qué:** los formularios del admin en este plan (agregar/quitar email) usan el patrón `<form action={serverAction}>` de React 19 con validación Zod en el servidor (CLAUDE.md: `requireAdmin() → Zod → escribir → logAudit → revalidatePath`), no estado de formulario en el cliente; `input`, `label`, `select`, `textarea` y `switch` (ya agregados) cubren lo necesario sin `react-hook-form`.
- **Impacto:** ninguno por ahora. Si un plan siguiente necesita validación de formulario en vivo en el cliente, evaluar `react-hook-form` + `zodResolver` a mano en ese momento.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 8] Fix a `use-mobile.ts` generado por shadcn (lint + hidratación) — 2026-09-28
- **Qué:** `src/hooks/use-mobile.ts` (traído por el componente `sidebar` de shadcn) llamaba `setIsMobile(...)` de forma síncrona dentro de un `useEffect`, lo que dispara `react-hooks/set-state-in-effect` (regla nueva de `eslint-config-next` 16) y rompe `pnpm lint`. Un primer intento movió el cálculo a un inicializador de `useState` leyendo `window.innerWidth` directamente, pero eso rompió la hidratación: el servidor no tiene `window`, así que siempre "renderiza" `false`, y si el ancho real del cliente en el primer render es angosto, el cliente calcula `true` de inmediato → mismatch (visto en vivo en `/admin/usuarios`, error de hidratación en `<SidebarInset>`). La solución final usa `React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`, el mecanismo pensado justo para esto: `getServerSnapshot` siempre da `false` (igual que el servidor) y React actualiza al valor real después de hidratar sin marcarlo como mismatch.
- **Por qué:** `pnpm lint` debe pasar en verde y la app no debe tener errores de hidratación (regla no negociable, más la exigencia de UI 375/1440 sin sorpresas). Si un plan futuro corre `pnpm dlx shadcn@latest add sidebar -o` de nuevo, este archivo se regenera y hay que reaplicar el mismo fix (no el de `useState`, que parece funcionar pero no lo hace).
- **Impacto:** `src/hooks/use-mobile.ts`. Ninguno en la interfaz pública del hook (`useIsMobile(): boolean`).
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 8] `trustedOrigins` de Better Auth incluye el puerto de e2e — 2026-09-28
- **Qué:** `src/lib/auth.ts` (hoy `src/lib/create-auth.ts`) agrega `trustedOrigins: ["http://localhost:3000", "http://localhost:3100"]` fuera de producción. `playwright.config.ts` levanta `next dev` en el puerto 3100 (para no chocar con lo que ya esté ocupando el 3000 en esta máquina) y sirve `e2e/global-setup.ts`, que carga `.env` a mano con `process.loadEnvFile()` (Playwright no hace autoload de `.env` como sí hace `next dev`), levanta `docker compose`, espera a Postgres, migra y crea/asegura un admin de prueba (`seed-admin@guerracampal.cl`).
- **Por qué:** Better Auth valida el header `Origin` contra `baseURL`/`trustedOrigins`; sin agregar el puerto 3100 explícito, todo login en los e2e fallaba con "Invalid origin" aunque las credenciales fueran correctas.
- **Impacto:** `src/lib/auth.ts`, `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/admin-auth.spec.ts`. Si un plan siguiente cambia el puerto de e2e, actualizar ambos lugares.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00] Script `pnpm typecheck` agregado (no estaba en el plan) — 2026-09-28
- **Qué:** se agrega `"typecheck": "next typegen && tsc --noEmit"` a `package.json` (en la revisión se le antepuso el borrado de `.next/dev/types`: los tipos que deja `next dev` quedan viejos cuando se mueve una ruta y rompían el typecheck). El Plan 00 (Task 1) nunca pidió este script — su lista de scripts era `dev|build|test|test:e2e|lint|db:generate|db:migrate|db:seed` — pero CLAUDE.md exige correr `pnpm typecheck` antes de cerrar cualquier tarea. Un `tsc --noEmit` sin más falla en frío (`Cannot find name 'LayoutProps'`) porque los tipos de rutas de Next.js (`LayoutProps`, `PageProps`, etc.) se generan en `.next/types` recién al correr `next dev`/`next build`/`next typegen`; por eso el script corre `next typegen` primero.
- **Por qué:** cerrar tareas sin poder correr `pnpm typecheck` (tal como pide CLAUDE.md) no es viable; esto lo destraba para el resto del proyecto.
- **Impacto:** `package.json`. Ningún plan siguiente necesita tocar esto — el comando ya existe y funciona.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 4] `agentRules: false` en next.config.ts — 2026-09-28
- **Qué:** se agrega `agentRules: false` a `next.config.ts`. Next.js 16 trae una función que reescribe `CLAUDE.md` en cada `next dev`/`next build`, agregando un bloque `<!-- BEGIN:nextjs-agent-rules -->` con avisos genéricos para agentes de IA sobre cambios de la versión.
- **Por qué:** este proyecto ya tiene un `CLAUDE.md` con reglas propias del proyecto (spec, arquitectura, convenciones); dejar que Next lo reescriba en cada arranque ensucia el diff y mezcla contenido no controlado por el equipo con las reglas del proyecto.
- **Impacto:** `next.config.ts`. Ninguno en planes siguientes.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 4] `testTimeout` global subido a 15 s en Vitest — 2026-09-28
- **Qué:** `vitest.config.ts` fija `test.testTimeout: 15000` (antes el default de 5000 ms).
- **Por qué:** con más de un archivo de test usando `createTestDb()` (PGlite/WASM), correr la suite completa en paralelo genera contención de CPU; cada test aislado tarda ~1-3 s pero bajo carga puede superar los 5 s del default y fallar por timeout, no por lógica incorrecta.
- **Impacto:** `vitest.config.ts`. Todo test de integración con PGlite en los planes siguientes se beneficia del mismo margen; no requiere configurarlo por archivo.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

## [Plan 00 · Task 4] Tablas de Better Auth escritas a mano, no con `@better-auth/cli generate` — 2026-09-28
- **Qué:** `src/db/schema/auth.ts` define `user`, `session`, `account`, `verification` manualmente en Drizzle, siguiendo el esquema estándar documentado de Better Auth, en vez de generarlas con `@better-auth/cli generate`.
- **Por qué:** el paquete `@better-auth/cli` publicado (1.4.21) está marcado deprecated y va un major por detrás de `better-auth` (1.7.6) instalado; generar el esquema con una CLI desalineada es más riesgoso que escribir las cuatro tablas estándar (estables entre versiones) a mano.
- **Impacto:** `src/db/schema/auth.ts`. Ningún plan siguiente depende del mecanismo de generación, solo de las tablas resultantes.
- **Estado:** aplicado · aplicado a planes siguientes (vía `docs/convenciones.md`)

---

# Revisión del Plan 00 (Opus) — 2026-09-28

## [Plan 00 · Revisión] Registro público cerrado; admins por invitación, Google o script
- **Qué:** `emailAndPassword.disableSignUp: true`. Nuevo `inviteAdmin(auth, db, email, actorId)` (agrega a la lista blanca, crea el usuario sin contraseña y le manda el enlace de "restablecer contraseña", que Better Auth usa también para crear la primera). `createAdminWithPassword` reemplaza a `auth.api.signUpEmail` en `scripts/create-admin.ts` y en el setup de e2e (si el admin existe, le cambia la clave). "Usuarios → Dar acceso" invita; no se puede quitar el propio acceso; quitar un correo cierra sus sesiones.
- **Por qué:** con registro público, cualquiera podía registrarse primero con un correo recién agregado a la lista blanca y quedarse con esa cuenta de admin (el hook solo miraba el correo, no quién lo registraba). Falla de seguridad crítica encontrada en la revisión.
- **Impacto:** `src/lib/create-auth.ts` (nuevo, fábrica testeable), `src/lib/auth.ts`, `src/features/admin-users/{accounts,allowlist,actions}.ts`. Interfaces que cambiaron respecto del plan: `addAllowedEmail` devuelve `boolean`; `removeAllowedEmail(db, email)` (se quitó `actorId`, no se usaba); las actions devuelven `{ error?, success? }`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Recuperar contraseña, correo y Google adelantados del Plan 06/07
- **Qué:** a pedido del usuario se dejó listo lo que el Plan 06 (Task 4 Step 3) y el 07 pedían: interfaz `Mailer` (`src/lib/mailer`, `MAIL_DRIVER=console|resend`, React Email), páginas `/admin/recuperar` y `/admin/restablecer`, plantilla `src/emails/admin-password-link.tsx`. Google se activa solo si existen `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`; los rechazos de Google por lista blanca vuelven al login como `?error=EMAIL_NOT_ALLOWED` con mensaje en español. Guía para el usuario en `docs/configuracion-externa.md`.
- **Por qué:** el usuario pidió dejarlo funcionando "para configurar después" sin tener que hacerlo ahora.
- **Impacto:** Plan 06 Task 4 reutiliza el `Mailer` (no lo crea) y su Step 3 quedó hecho. Plan 07 Step 1 sigue `docs/configuracion-externa.md`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] `requireAdmin()` en cada página del admin (cacheado por request)
- **Qué:** todas las páginas de `(protected)` llaman `requireAdmin()`; `getAdmin()` usa `cache()` de React para no repetir la consulta. El login usa `getAdmin()` para mandar al panel si ya hay sesión. El login dejó de ser una página `"use client"` completa (página servidor + `LoginForm` cliente).
- **Por qué:** los layouts no se vuelven a ejecutar al navegar entre páginas hermanas; con la verificación solo en el layout, una sesión revocada seguía leyendo datos. CLAUDE.md regla 4 lo exige por ruta.
- **Impacto:** `src/lib/require-admin.ts` y páginas del admin. Planes siguientes: toda página nueva del admin llama `requireAdmin()`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Papelera con registro estático, títulos y paginación
- **Qué:** se eliminó `registerTrashable` (registro por efecto secundario). Ahora `createTrash(entidades)` y un único `src/features/trash/registry.ts` donde cada plan agrega su entidad con `type`, `label` ("Peleador") y `title` (columna o SQL). `listTrash(db, { page })` devuelve `{ items, hasMore }` con el título legible. `softDelete`/`restore` fallan si el elemento no existe (antes auditaban igual). El handler del cron se movió a `src/features/trash/purge-handler.ts`, compara el secreto en tiempo constante y registra las purgas en el historial.
- **Por qué:** con el registro por efecto secundario, la página de Papelera y el cron solo veían tablas cuyo módulo se hubiera importado en esa misma ruta: al llegar el Plan 02, la papelera y la purga habrían ignorado a los peleadores.
- **Impacto:** Plan 02 (Task 4) actualizado para registrar `fighters` en `registry.ts`; igual Plan 03 (eventos) y 04 (noticias) vía `docs/convenciones.md`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Historial paginado y con autor; índices; límite de intentos
- **Qué:** `listRecentAudit` → `listAuditLog(db, { page })` con `actorEmail` (join a `user`; "Sistema" para el cron). Índices nuevos: `audit_log(created_at)`, `audit_log(entity_type, entity_id)`, `session(user_id)`, `account(user_id)`, `verification(identifier)`. Tabla `rate_limit` para que el límite de intentos de login de Better Auth funcione en serverless (en memoria no se comparte entre instancias).
- **Por qué:** CLAUDE.md exige paginar listados e indexar columnas de `where`/`orderBy`/FKs; el historial no decía quién hizo cada acción (la spec lo pide).
- **Impacto:** migración `drizzle/0004_*`. Patrón de paginación en `docs/convenciones.md`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Fechas con zona horaria fija
- **Qué:** `formatDate`/`formatDateTime` en `src/lib/format-date.ts` (es-CL, `America/Santiago`, 24 h). Reemplaza tres copias de `Intl.DateTimeFormat` sin zona.
- **Por qué:** Vercel corre en UTC; sin zona fija, una fecha cerca de medianoche se veía distinta en servidor y navegador (día equivocado y error de hidratación).
- **Impacto:** convención para todos los planes.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Cliente Postgres sin prepared statements
- **Qué:** `postgres(url, { prepare: false })` y el cliente se reutiliza en `globalThis` durante `next dev`.
- **Por qué:** los poolers en modo transacción (Supabase, PgBouncer) no aceptan prepared statements; con esto la misma `DATABASE_URL` funciona en cualquier proveedor o VPS (regla de portabilidad). En dev evita abrir conexiones nuevas en cada recarga.
- **Impacto:** `src/db/index.ts`. Ninguno en planes siguientes.
- **Estado:** aplicado

## [Plan 00 · Revisión] E2E con base de datos propia; tests de BD más rápidos
- **Qué:** los e2e usan `guerra_campal_e2e` (se crea y se vacía en cada corrida; `E2E_DATABASE_URL` para cambiarla) y nunca reutilizan un `pnpm dev` abierto. Login reutilizable `signInAsAdmin(page)` en `e2e/fixtures/admin.ts`; `expect.timeout` 15 s (primera compilación de rutas en `next dev`). En Vitest, `createTestDb()` clona una plantilla PGlite ya migrada por worker, `maxWorkers: "50%"` y `hookTimeout` 30 s.
- **Por qué:** los e2e dejaban en la BD de desarrollo un admin con contraseña conocida y correos falsos con acceso (se limpiaron). Con 17 archivos de test, arrancar PGlite en ~11 workers a la vez hacía fallar los `beforeAll` por timeout.
- **Impacto:** convenciones de tests en `docs/convenciones.md`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Accesibilidad y reglas de UI de CLAUDE.md
- **Qué:** menú móvil con foco al abrir, Tab atrapado, Escape, foco de vuelta al botón y scroll bloqueado; anima con transform/opacity (antes `clip-path`). Header sólido como capa con `opacity`. `Logo` y `Flag` con nombre accesible (bandera = país en español). Footer como Server Component (`NAV_LINKS` pasó a `nav-links.ts`; se quitó `SiteChrome`). Admin: etiquetas visibles, objetivos de 44 px en pantallas táctiles (por `data-slot` en `globals.css`), `loading.tsx`/`error.tsx`, cerrar sesión, sidebar que marca subrutas y se cierra al navegar en móvil, textos de lector de pantalla de shadcn en español, `noindex` en todo `/admin`, toasts siempre oscuros (se quitó `next-themes`). `prefers-reduced-motion` global.
- **Por qué:** incumplían reglas explícitas de CLAUDE.md (accesibilidad, 44 px, etiquetas visibles, estados, solo transform/opacity, no marcar páginas completas como cliente).
- **Impacto:** convenciones de UI en `docs/convenciones.md`.
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Convenciones en un solo documento
- **Qué:** `docs/convenciones.md` resume los patrones ya construidos (actions, auth, correo, papelera, paginación, fechas, UI, tests). Cada plan 01–07 lo referencia en sus Global Constraints y `CLAUDE.md` lo enlaza.
- **Por qué:** evitar que los planes siguientes reinventen o contradigan lo que Plan 00 ya resolvió.
- **Impacto:** planes 01–07 (una línea cada uno).
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 00 · Revisión] Pendiente para el Plan 07: preview deployments de Vercel
- **Qué:** `trustedOrigins` solo agrega localhost fuera de producción. Los preview de Vercel corren con `NODE_ENV=production` y otra URL, así que el login no funcionará ahí hasta configurar `BETTER_AUTH_URL`/orígenes por entorno.
- **Por qué:** se deja anotado para decidirlo al desplegar.
- **Impacto:** Plan 07 (despliegue).
- **Estado:** pendiente

---

# Plan 01 · Medios (ejecución) — 2026-09-28

## [Plan 01 · Task 2] Claves de variantes con versión y límite de tamaño verificado al finalizar
- **Qué:** las variantes se guardan en `variants/<mediaId>/<versión>/<ancho>.webp` (el plan decía `variants/<mediaId>/<ancho>.webp`). Cada edición genera una versión nueva y borra las claves anteriores. El driver S3 marca `variants/*` con `Cache-Control: public, max-age=31536000, immutable`. Además, la URL prefirmada de S3 no puede limitar el tamaño (haría falta conocer el largo exacto al firmar): el límite de 15 MB se verifica en `finalizeUpload` con el archivo real (lo descarta si lo supera). El driver local sí lo valida al recibir el PUT.
- **Por qué:** con la clave fija, un cambio de recorte se vería con la imagen vieja en el CDN/navegador hasta que venciera la caché; con versión en la clave se puede cachear para siempre (CLAUDE.md: rendimiento) y una re-edición nunca deja a medias una imagen en uso.
- **Impacto:** `src/features/media/service.ts`, `src/lib/storage/s3.ts`. Nadie fuera de `media` debe armar claves a mano: se usa `MediaDTO.variants[].url`.
- **Estado:** aplicado

## [Plan 01 · Task 4] Lógica en `service.ts`, las actions quedan delgadas; actions devuelven `{ error } | { data }`
- **Qué:** `createUpload`, `finalizeUpload`, `saveMediaEdit` y `purgeOrphanMedia` reciben `(db, storage, …)` y se prueban con PGlite + `LocalDriver` en carpeta temporal (`service.test.ts`). `actions.ts` solo hace `requireAdmin()` → Zod → servicio → `logAudit`. Los errores para personas son `MediaError`; cualquier otro error se reemplaza por un mensaje genérico (no se filtran detalles). Las actions devuelven `{ data }` en éxito porque el cliente necesita `mediaId`, `uploadUrl`, dimensiones y el DTO (la convención `{ error?, success? }` no lleva datos).
- **Por qué:** el plan pedía probar `actions.ts` directo, pero usa `headers()` (docs/convenciones.md ya lo dice). Se agregó además `getMediaByIds` (una consulta para galerías, sin N+1) y `getMediaEdit`/`getMediaEditAction` (reabrir el editor con recorte/giro/ajustes guardados; el `MediaDTO` del plan no los trae). `getMedia*` solo devuelve imágenes `ready` y sin `deleted_at`: una subida abortada nunca se ve.
- **Impacto:** Planes 02–04 usan `getMedia`/`getMediaByIds` en sus queries y `MediaField`/`MediaGalleryField` en sus formularios; no llaman a las actions de media directamente.
- **Estado:** aplicado · pendiente de reflejar en planes 02–04 (lo hace la revisión)

## [Plan 01 · Task 4] El cron de purga también limpia subidas abandonadas
- **Qué:** `handlePurge` acepta la dependencia opcional `purgeOrphanMedia`; `/api/cron/purge` la pasa. La respuesta pasa a `{ purged, orphanMedia }` cuando se entrega (con la firma anterior sigue igual) y se audita como `entityType: "media"`.
- **Por qué:** el plan pedía "registrada en el cron del Plan 00"; el handler solo conocía `purgeExpired`.
- **Impacto:** `src/features/trash/purge-handler.ts`, `src/app/api/cron/purge/route.ts`.
- **Estado:** aplicado

## [Plan 01 · Task 3] Tabla `media`, `MediaEdit` con Zod, recorte por defecto centrado
- **Qué:** `media.width/height` son nulables (una subida `pending` aún no tiene dimensiones). `MediaEdit` es un esquema Zod (`src/features/media/schema.ts`, ajustes 0.5–1.5, giro 0/90/180/270, enfoque 0–1) porque la action valida el input con él. Si `crop` es `null`, `renderVariants` recorta al aspecto del tipo centrado en el punto de enfoque (garantiza el formato fijo). Recorte y ajustes se aplican una vez y cada ancho se redimensiona desde ese resultado. Si el recorte es menor que todas las variantes, se genera una sola del ancho del recorte (el plan las omitía todas y no quedaba imagen). El `focal` es relativo al resultado recortado (coincide con `object-position` de las variantes servidas).
- **Por qué:** ver arriba; todo dentro del espíritu del spec §5.
- **Impacto:** Planes 02–04: `object-position` ya lo aplica `MediaImage`.
- **Estado:** aplicado

## [Plan 01 · Task 5] Editor: controles nativos y proporción libre
- **Qué:** zoom/brillo/contraste/saturación usan `<input type="range">` y la proporción libre (galería) un `<select>` nativo, no shadcn Slider/Select. `react-easy-crop` no soporta recorte libre, así que `gallery` ofrece proporciones predefinidas (Original por defecto). La vista previa recortada se dibuja en un canvas (`crop-preview.ts`); si la imagen original vive en un bucket sin CORS, el canvas no puede leerla y la vista cae a la imagen completa sin recortar (el resultado guardado no se afecta). Se agregó `aspectLabel` a `MEDIA_SPECS` y `describeSpec()`.
- **Por qué:** objetivos táctiles de 44 px, sin dependencias nuevas ni `ResizeObserver` en tests.
- **Impacto:** al configurar S3/R2 en producción, el bucket necesita CORS: `PUT` (subida directa desde el navegador) y `GET` (editar de nuevo una imagen). Anotar en Plan 07 (despliegue).
- **Estado:** aplicado · pendiente para Plan 07 (CORS del bucket)

## [Plan 01 · Task 6] Quitar fondo: Xenova/modnet
- **Qué:** modelo `Xenova/modnet` (Apache-2.0, verificado en la ficha) con `@huggingface/transformers` (Apache-2.0) en un Web Worker; el modelo se baja del Hub de Hugging Face la primera vez y queda en caché del navegador. Documentado en `src/features/media/bg-removal/README.md`. El resultado (PNG con alfa) se sube como un original nuevo y reemplaza al anterior en el editor. Verificado a mano con una foto de prueba: esquina alpha 0, cuerpo opaco.
- **Por qué:** pedido por el plan (licencia permisiva verificada antes de fijar el modelo).
- **Impacto:** si se quiere no depender del Hub en producción, alojar el modelo en el bucket (nota en el README). Plan 07 puede decidirlo.
- **Estado:** aplicado

## [Plan 01 · Task 7] Campos con imagen ya cargada, galería y página de pruebas
- **Qué:** `MediaField` recibe además `media?: MediaDTO` (imagen ya guardada; la carga el servidor) y `MediaGalleryField` `media?: MediaDTO[]`; ambos emiten un `<input type="hidden" name>` por valor para usarse en `<form action>`. En galería cada foto se guarda con la edición neutra al subirla (sin abrir el editor una por una) y se puede editar después; el orden se cambia arrastrando o con los botones Subir/Bajar. Los logos SVG se guardan tal cual (sanitizados) sin editor. Se agregó una página **solo de desarrollo** `/admin/medios` ("Prueba de imágenes", 404 en producción) para revisar el flujo a mano y en los e2e, porque el plan no trae ninguna pantalla que use los campos.
- **Por qué:** sin `media` inicial no hay con qué mostrar la miniatura al editar una entidad; sin página no hay dónde probar (los Planes 02–04 traen los formularios reales).
- **Impacto:** Planes 02–04 pasan `media` (de `getMediaByIds`) a los campos. Cuando existan formularios reales, se puede borrar `/admin/medios`.
- **Estado:** aplicado · pendiente de reflejar en planes 02–04 (lo hace la revisión)

## [Plan 01] E2E y build con carpeta propia (`.next-e2e`) y almacenamiento temporal
- **Qué:** `next.config.ts` usa `distDir: process.env.E2E_DIST_DIR ?? ".next"`; `playwright.config.ts` fija `E2E_DIST_DIR=.next-e2e` y `STORAGE_LOCAL_DIR` (carpeta temporal del sistema). `tsconfig.json`, `.gitignore` y ESLint conocen `.next-e2e`. El `LocalDriver` lee `STORAGE_LOCAL_DIR` (por defecto `.storage/`, ignorado por git).
- **Por qué:** con un `pnpm dev` abierto (caso real: el usuario lo tenía corriendo), Next 16 se niega a levantar un segundo servidor sobre el mismo `.next` ("Another next dev server is already running") y los e2e no arrancaban. Así los e2e y `pnpm build` (con `E2E_DIST_DIR=.next-e2e`) corren aunque haya un `pnpm dev` abierto, sin cerrarlo, y las imágenes de prueba no ensucian el proyecto.
- **Impacto:** convención de tests (anotada en `docs/convenciones.md`).
- **Estado:** aplicado · aplicado a planes siguientes

## [Plan 01 · Task 2] ESLint: argumentos no usados con prefijo `_`
- **Qué:** `@typescript-eslint/no-unused-vars` ignora argumentos que empiezan con `_` (los drivers de almacenamiento implementan una interfaz común y a veces no usan todos los parámetros).
- **Por qué:** mantener lint sin warnings sin quitar parámetros de la interfaz.
- **Impacto:** `eslint.config.mjs`.
- **Estado:** aplicado

## [Plan 01 · Pendientes] Para planes siguientes
- **Qué:** (1) "Quitar" una imagen en un campo solo desliga el id del formulario: la fila `media` queda `ready` sin dueño. Falta una limpieza de medios ya usados y luego huérfanos (Plan 02+, cuando exista quién referencie `media.id`; decidir si se borran al guardar o por cron). (2) Cuando un peleador/evento/noticia vaya a la papelera o se purgue, sus `media` no se borran. (3) `media` no está en el registro de papelera: no se elimina de forma independiente.
- **Por qué:** el Plan 01 no tiene entidades que referencien medios.
- **Impacto:** Planes 02–04 (FKs a `media.id`) y Plan 07 (limpieza).
- **Estado:** pendiente

## [Plan 01 · Ajuste posterior] Nitidez en el editor y causa del "No se pudo preparar la subida"
- **Qué:** (1) El error "No se pudo preparar la subida" venía de que la base de desarrollo no tenía aplicada la migración `0005` (tabla `media`); el `insert` fallaba y la action devolvía el mensaje genérico. Se aplicó con `pnpm db:migrate` y se verificó `createUpload` contra la base real. Ahora `actions.ts` deja la causa real en el log del servidor (`console.error`) además del mensaje genérico. (2) Se agregó el ajuste **Nitidez** (0–2, por defecto 0): vista previa con un filtro SVG (`feConvolveMatrix`) y, en el servidor, `sharpen()` de sharp aplicado después de achicar cada variante. Las ediciones guardadas antes no lo traen: el esquema Zod lo completa con 0 y `getMediaEdit` mezcla los valores por defecto. Los pies de las vistas previas indican la proporción de cada contexto.
- **Por qué:** pedido del usuario (editor con vista previa por proporción, quitar fondo y ajustes básicos: brillo, nitidez, etc.). Se mantiene el editor propio sobre `react-easy-crop` en vez de adoptar uno OSS completo (p. ej. Filerobot/TUI Image Editor) porque necesitamos proporciones fijas por tipo, punto de enfoque, vistas previas en los contextos reales y que el servidor genere las variantes; un editor genérico traería 1 MB+ de JS y no cubriría eso.
- **Impacto:** `src/features/media/{schema,process,queries,actions}.ts`, `components/adjustments.tsx`, `preview-frames.tsx`. Ninguno en planes siguientes.
- **Estado:** aplicado

## [Plan 01 · Ajuste posterior] Rediseño del editor de imágenes (PC y celular)
- **Qué:** el editor pasa a un diálogo con estructura fija: en celular es pantalla completa (zona de recorte de 44 dvh, herramientas debajo, luego vista previa, ajustes y texto alternativo, pie fijo con Cancelar/Guardar); en PC es una ventana de `min(92dvh, 52rem)` con la zona de recorte a la izquierda y un panel a la derecha (vistas previas, quitar fondo, ajustes, texto alternativo), pie siempre visible. Nuevos: selector Recortar/Enfoque grande con texto, giro con botones de icono junto al zoom, fondo de ajedrez para notar la transparencia, vistas previas en una fila con nombre y proporción, ajustes en dos columnas con "Restablecer", el selector de enfoque a tamaño máximo (`--stage-h`) con marcador visible.
- **Por qué:** en la primera versión el pie quedaba fuera de pantalla en PC (había que desplazarse para guardar), las vistas previas se apilaban desordenadas y todo era una columna larga.
- **Impacto:** `src/features/media/components/*` (sin cambios de API: `ImageEditor`, `MediaField`, `MediaGalleryField` iguales). Nota: el diálogo usa `sm:max-w-6xl`; las clases arbitrarias con `min()` en `max-w` no se generaron bien con Turbopack.
- **Estado:** aplicado
