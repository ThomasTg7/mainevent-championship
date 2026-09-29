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
