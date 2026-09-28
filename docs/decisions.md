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
- **Estado:** aplicado

## [Plan 00 · Task 5] `DATABASE_URL` de relleno en `src/test/setup.ts` — 2026-09-28
- **Qué:** el setup global de Vitest fija `process.env.DATABASE_URL` a un valor de relleno si no está definida.
- **Por qué:** `src/db/index.ts` lanza al importarse si falta `DATABASE_URL` (por diseño, para fallar rápido en producción). Rutas como `/api/cron/purge` importan el singleton `db` a nivel de módulo para su handler real (`GET`), aunque sus tests unitarios inyectan una base de prueba (PGlite) y nunca tocan `db`. Sin el valor de relleno, el solo hecho de importar el archivo de la ruta rompía el test. `postgres.js` conecta de forma perezosa (recién en la primera consulta), así que el valor de relleno nunca abre una conexión real.
- **Impacto:** `src/test/setup.ts`. Cualquier test futuro que importe (sin ejecutar) un módulo que re-exporta `db` queda cubierto.
- **Estado:** aplicado

## [Plan 00 · Task 8] `src/lib/cn.ts` pasa a re-exportar el paquete `cn` — 2026-09-28
- **Qué:** `pnpm dlx shadcn@latest init`/`add` generan y regeneran `src/lib/utils.ts` con `export { cn } from "cn"` (paquete oficial de shadcn-ui, "drop-in replacement" de clsx+tailwind-merge) y templan sus componentes (`src/components/ui/*`) importando `cn` directamente desde el paquete `"cn"`, ignorando el alias `aliases.utils` de `components.json` para ese import puntual. Pelear esa convención en cada `shadcn add` de los planes siguientes no es sostenible. En vez de eso, `src/lib/cn.ts` (el helper de Task 1) ahora también re-exporta `cn` desde el paquete `"cn"`; se quitaron `clsx` y `tailwind-merge` (quedaron sin uso). `components.json.aliases.utils` queda en su valor por defecto `"@/lib/utils"`.
- **Qué (más):** también se reescribió `src/app/globals.css` (shadcn dejó `--color-border` duplicado y un tema claro/oscuro con paleta gris) y `src/app/layout.tsx` (shadcn agregó una fuente Geist redundante) para usar solo los tokens de marca Guerra Campal, con `--radius: 0` para mantener los bordes rectos de la identidad visual en todos los componentes shadcn.
- **Por qué:** una sola implementación real de `cn` (el paquete npm), referenciada desde `@/lib/cn` (código propio: Button, Header, Footer, Tag, etc.) y `@/lib/utils` (lo que genera el CLI de shadcn) sin duplicar lógica ni pelear la codegen en cada plan. El tema gris de shadcn y la fuente Geist contradicen el sistema de diseño de Task 6 (negro/amarillo, Anton/Barlow) y el panel admin no tiene modo claro.
- **Impacto:** `src/lib/cn.ts`, `src/lib/utils.ts`, `components.json`, `src/app/globals.css`, `src/app/layout.tsx`, `package.json` (fuera: `clsx`, `tailwind-merge`; dentro: `cn`). Ningún plan siguiente necesita tocar esto: `shadcn add` seguirá funcionando tal cual.
- **Estado:** aplicado

## [Plan 00 · Task 8] Componente `form` de shadcn omitido (no existe en esta versión) — 2026-09-28
- **Qué:** el plan pedía agregar el componente `form` de shadcn junto a los demás. En shadcn 4.21 (estilo `radix-nova`) ese registro existe pero está vacío (`{"name":"form","type":"registry:ui"}`, sin archivos ni dependencias): la versión nueva no trae el wrapper clásico basado en `react-hook-form` + `zodResolver`. No se agrega.
- **Por qué:** los formularios del admin en este plan (agregar/quitar email) usan el patrón `<form action={serverAction}>` de React 19 con validación Zod en el servidor (CLAUDE.md: `requireAdmin() → Zod → escribir → logAudit → revalidatePath`), no estado de formulario en el cliente; `input`, `label`, `select`, `textarea` y `switch` (ya agregados) cubren lo necesario sin `react-hook-form`.
- **Impacto:** ninguno por ahora. Si un plan siguiente necesita validación de formulario en vivo en el cliente, evaluar `react-hook-form` + `zodResolver` a mano en ese momento.
- **Estado:** aplicado

## [Plan 00 · Task 8] Fix a `use-mobile.ts` generado por shadcn (lint + hidratación) — 2026-09-28
- **Qué:** `src/hooks/use-mobile.ts` (traído por el componente `sidebar` de shadcn) llamaba `setIsMobile(...)` de forma síncrona dentro de un `useEffect`, lo que dispara `react-hooks/set-state-in-effect` (regla nueva de `eslint-config-next` 16) y rompe `pnpm lint`. Un primer intento movió el cálculo a un inicializador de `useState` leyendo `window.innerWidth` directamente, pero eso rompió la hidratación: el servidor no tiene `window`, así que siempre "renderiza" `false`, y si el ancho real del cliente en el primer render es angosto, el cliente calcula `true` de inmediato → mismatch (visto en vivo en `/admin/usuarios`, error de hidratación en `<SidebarInset>`). La solución final usa `React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`, el mecanismo pensado justo para esto: `getServerSnapshot` siempre da `false` (igual que el servidor) y React actualiza al valor real después de hidratar sin marcarlo como mismatch.
- **Por qué:** `pnpm lint` debe pasar en verde y la app no debe tener errores de hidratación (regla no negociable, más la exigencia de UI 375/1440 sin sorpresas). Si un plan futuro corre `pnpm dlx shadcn@latest add sidebar -o` de nuevo, este archivo se regenera y hay que reaplicar el mismo fix (no el de `useState`, que parece funcionar pero no lo hace).
- **Impacto:** `src/hooks/use-mobile.ts`. Ninguno en la interfaz pública del hook (`useIsMobile(): boolean`).
- **Estado:** aplicado

## [Plan 00 · Task 8] `trustedOrigins` de Better Auth incluye el puerto de e2e — 2026-09-28
- **Qué:** `src/lib/auth.ts` agrega `trustedOrigins: ["http://localhost:3000", "http://localhost:3100"]` fuera de producción. `playwright.config.ts` levanta `next dev` en el puerto 3100 (para no chocar con lo que ya esté ocupando el 3000 en esta máquina) y sirve `e2e/global-setup.ts`, que carga `.env` a mano con `process.loadEnvFile()` (Playwright no hace autoload de `.env` como sí hace `next dev`), levanta `docker compose`, espera a Postgres, migra y crea/asegura un admin de prueba (`seed-admin@guerracampal.cl`).
- **Por qué:** Better Auth valida el header `Origin` contra `baseURL`/`trustedOrigins`; sin agregar el puerto 3100 explícito, todo login en los e2e fallaba con "Invalid origin" aunque las credenciales fueran correctas.
- **Impacto:** `src/lib/auth.ts`, `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/admin-auth.spec.ts`. Si un plan siguiente cambia el puerto de e2e, actualizar ambos lugares.
- **Estado:** aplicado

## [Plan 00] Script `pnpm typecheck` agregado (no estaba en el plan) — 2026-09-28
- **Qué:** se agrega `"typecheck": "next typegen && tsc --noEmit"` a `package.json`. El Plan 00 (Task 1) nunca pidió este script — su lista de scripts era `dev|build|test|test:e2e|lint|db:generate|db:migrate|db:seed` — pero CLAUDE.md exige correr `pnpm typecheck` antes de cerrar cualquier tarea. Un `tsc --noEmit` sin más falla en frío (`Cannot find name 'LayoutProps'`) porque los tipos de rutas de Next.js (`LayoutProps`, `PageProps`, etc.) se generan en `.next/types` recién al correr `next dev`/`next build`/`next typegen`; por eso el script corre `next typegen` primero.
- **Por qué:** cerrar tareas sin poder correr `pnpm typecheck` (tal como pide CLAUDE.md) no es viable; esto lo destraba para el resto del proyecto.
- **Impacto:** `package.json`. Ningún plan siguiente necesita tocar esto — el comando ya existe y funciona.
- **Estado:** aplicado

## [Plan 00 · Task 4] `agentRules: false` en next.config.ts — 2026-09-28
- **Qué:** se agrega `agentRules: false` a `next.config.ts`. Next.js 16 trae una función que reescribe `CLAUDE.md` en cada `next dev`/`next build`, agregando un bloque `<!-- BEGIN:nextjs-agent-rules -->` con avisos genéricos para agentes de IA sobre cambios de la versión.
- **Por qué:** este proyecto ya tiene un `CLAUDE.md` con reglas propias del proyecto (spec, arquitectura, convenciones); dejar que Next lo reescriba en cada arranque ensucia el diff y mezcla contenido no controlado por el equipo con las reglas del proyecto.
- **Impacto:** `next.config.ts`. Ninguno en planes siguientes.
- **Estado:** aplicado

## [Plan 00 · Task 4] `testTimeout` global subido a 15 s en Vitest — 2026-09-28
- **Qué:** `vitest.config.ts` fija `test.testTimeout: 15000` (antes el default de 5000 ms).
- **Por qué:** con más de un archivo de test usando `createTestDb()` (PGlite/WASM), correr la suite completa en paralelo genera contención de CPU; cada test aislado tarda ~1-3 s pero bajo carga puede superar los 5 s del default y fallar por timeout, no por lógica incorrecta.
- **Impacto:** `vitest.config.ts`. Todo test de integración con PGlite en los planes siguientes se beneficia del mismo margen; no requiere configurarlo por archivo.
- **Estado:** aplicado

## [Plan 00 · Task 4] Tablas de Better Auth escritas a mano, no con `@better-auth/cli generate` — 2026-09-28
- **Qué:** `src/db/schema/auth.ts` define `user`, `session`, `account`, `verification` manualmente en Drizzle, siguiendo el esquema estándar documentado de Better Auth, en vez de generarlas con `@better-auth/cli generate`.
- **Por qué:** el paquete `@better-auth/cli` publicado (1.4.21) está marcado deprecated y va un major por detrás de `better-auth` (1.7.6) instalado; generar el esquema con una CLI desalineada es más riesgoso que escribir las cuatro tablas estándar (estables entre versiones) a mano.
- **Impacto:** `src/db/schema/auth.ts`. Ningún plan siguiente depende del mecanismo de generación, solo de las tablas resultantes.
- **Estado:** aplicado
