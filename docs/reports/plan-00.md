# Reporte — Plan 00 · Fundación

Rama: `plan-00` · Ejecutado por Sonnet (superpowers:executing-plans) · 2026-09-28

## Tareas completadas

1. **Scaffold del proyecto y tooling** — Next.js 16 (App Router, `src/`, TS strict), Tailwind v4, Vitest + Testing Library, `cn()`. Commit `d95d010`.
2. **Base de datos, migraciones y BD de prueba** — Drizzle + `postgres.js`, PGlite para tests (`createTestDb`), `docker-compose.yml`, `scripts/seed.ts`. Commit `e47bca2`.
3. **Dominio de publicación** — `isPublic`, `publicScope` (Drizzle SQL equivalente), con test de integración comparando ambos contra 6 combinaciones. Commit `e078b5f`.
4. **Auth con lista blanca** — Better Auth (email+contraseña y Google), tablas `user/session/account/verification` + `allowed_emails`, hooks `beforeUserCreate`/`beforeSessionCreate`, `requireAdmin`, `proxy.ts`, `scripts/create-admin.ts`. Commit `db9af57`.
5. **Auditoría y papelera** — `audit_log`, `logAudit`, `registerTrashable`/`softDelete`/`restore`/`listTrash`/`purgeExpired`, `GET /api/cron/purge` con `Bearer ${CRON_SECRET}`, `vercel.json` (cron 04:00 UTC). Commit `24e9cad`.
6. **Sistema de diseño** — tokens GC en `@theme`, fuentes (Anton/Barlow/Barlow Condensed), `Logo`, `Button` (primary/ghost/dark con relleno animado), `SectionHeading`, `Tag`, `Flag` (SVG local). Commit `18b7afe`.
7. **Layout público** — `Header` (sólido tras 40px, oculta/reaparece con el scroll), `MobileMenu`, `Footer`, `SmoothScroll` (Lenis + GSAP con import dinámico, respeta `prefers-reduced-motion`), e2e con Playwright. Commit `ae273ea`.
8. **Shell del panel admin y usuarios** — shadcn/ui (tema oscuro con tokens GC, `--radius: 0`), sidebar con 12 secciones, `/admin/login`, `AdminPage`, gestión de lista blanca (agregar/quitar con diálogo de confirmación, tabla en escritorio + tarjetas en móvil), papelera e historial, e2e de login→Usuarios→Historial. Commit `f2b6c43`.

Commit adicional fuera de una tarea específica: `chore: add pnpm typecheck script` (ver desviaciones).

## Desviaciones (ver `docs/decisions.md` para el detalle completo)

Todas están marcadas `aplicado`; ninguna quedó pendiente de resolver.

- **Task 1** — Vitest 5 no trae `environmentMatchGlobs`: ambiente por archivo vía pragma `// @vitest-environment jsdom`.
- **Task 4** — Tablas de Better Auth escritas a mano (el paquete `@better-auth/cli` está deprecated y desalineado de versión).
- **Task 4** — `testTimeout` de Vitest subido a 15s (contención de CPU con varias instancias PGlite en paralelo).
- **Task 4** — `agentRules: false` en `next.config.ts` (Next 16 reescribía `CLAUDE.md` en cada `next dev`).
- **Task 5** — `DATABASE_URL` de relleno en el setup de Vitest (módulos que re-exportan `db` a nivel de módulo, sin tocarlo en el test).
- **Task 8** — `src/lib/cn.ts` re-exporta el paquete `cn` de shadcn en vez de duplicar clsx+tailwind-merge (evita pelear la codegen de `shadcn add` en cada plan).
- **Task 8** — Componente `form` de shadcn omitido: en esta versión el registro está vacío (sin `react-hook-form`); los formularios del admin usan `<form action={...}>` de React 19 con Zod en el servidor.
- **Task 8** — Fix a `src/hooks/use-mobile.ts` (generado por shadcn): tenía un error de lint y, en un primer intento de arreglo, un error de hidratación real; la solución final usa `useSyncExternalStore`.
- **Task 8** — `trustedOrigins` de Better Auth incluye el puerto de e2e (3100) para que el login funcione en los tests de Playwright.
- **Fuera de tarea** — se agregó `pnpm typecheck` (`next typegen && tsc --noEmit`): CLAUDE.md lo exige pero el plan nunca pidió crear el script.

## Pendientes (para planes siguientes o antes de producción)

- Google OAuth no tiene credenciales reales (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` vacíos en `.env.example`); el botón "Continuar con Google" existe pero no funciona hasta configurarlas.
- `BETTER_AUTH_SECRET` y `CRON_SECRET` en `.env`/`.env.example` son valores de desarrollo; deben generarse valores reales antes de desplegar.
- Recuperar contraseña por email (mencionado en la spec §6) no está implementado — Better Auth lo soporta, falta cablearlo con un proveedor de email (Resend, planeado para el Plan 06).
- Las 8 secciones placeholder del admin (Peleadores, Divisiones, Eventos, Noticias, Rankings, Patrocinadores, Bandeja, Configuración) y el dashboard de "Inicio" son intencionalmente stubs — los llenan los planes 02–06 según la hoja de ruta de la spec.
- La papelera y el historial están vacíos porque ningún plan siguiente registró todavía una tabla trashable real (`registerTrashable`) ni una acción de escritura de dominio — se poblarán solos cuando el Plan 02 (peleadores) empiece a usarlos.

## Comandos para probar

```bash
docker compose up -d
pnpm db:migrate
pnpm tsx scripts/create-admin.ts tu@correo.cl "tu-password"
pnpm dev
```

Verificación completa (lo que se corrió antes de cerrar el plan):

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

`pnpm test:e2e` levanta Docker, migra y crea un admin de prueba (`seed-admin@guerracampal.cl` / `SeedPassword123!`) por su cuenta vía `e2e/global-setup.ts`; no hace falta el bloque anterior solo para correr los e2e.

## Qué pantallas mirar

- **`/`** — home "Próximamente" con el logo; header sólido al bajar 40px, se oculta/reaparece con el scroll; menú "☰" en móvil. Revisar en 375px y 1440px (sin scroll horizontal).
- **`/admin/login`** — login con correo+contraseña; probar con un correo no listado para ver "Este correo no tiene acceso", y sin sesión visitar `/admin` para confirmar el redirect.
- **`/admin`** — Inicio (placeholder) y el sidebar con las 12 secciones; en móvil, el sidebar se abre como panel lateral con el botón de arriba a la izquierda.
- **`/admin/usuarios`** — agregar un correo (aparece de inmediato en la tabla), quitarlo (diálogo de confirmación primero); en 375px la tabla se convierte en tarjetas apiladas.
- **`/admin/historial`** — debe mostrar la acción de agregar/quitar correo que se acaba de hacer.
- **`/admin/papelera`** — vacía por ahora ("La papelera está vacía"), es esperado.
