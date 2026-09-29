# Plan 07 — SEO, analítica, calidad y lanzamiento · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SEO técnico completo, analítica sin cookies, verificación de rendimiento y accesibilidad, despliegue en Vercel y documentación para operar y migrar a VPS.

**Architecture:** Helpers puros de metadatos y JSON-LD en `src/domain/seo.ts`; cada página los usa en `generateMetadata` y renderiza `<JsonLd>`. `sitemap.ts` y `robots.ts` de Next leen la BD con el mismo `publicScope`. Presupuestos de rendimiento con Lighthouse CI y accesibilidad con axe en Playwright.

**Tech Stack:** Heredado. `@vercel/analytics` (o Umami por script), `@lhci/cli`, `@axe-core/playwright`, `schema-dts` (tipos JSON-LD).

**Spec:** `docs/superpowers/specs/2026-09-28-guerra-campal-design.md` (§1, §7)

## Global Constraints

- Seguir `docs/convenciones.md` (patrones ya construidos y probados en Plan 00: actions, auth, correo, papelera, paginación, fechas, tests). Manda sobre lo que diga este plan si hay conflicto.
- Hereda Plan 00–06.
- Plantilla de título: `"%s | Guerra Campal"`; home: `"Guerra Campal — MMA en Chile"`.
- Descripción máx. 160 caracteres (se trunca en palabra completa con "…").
- Imagen Open Graph: la de `settings.share.ogMediaId` (1200×630); fallback estático `public/og-default.jpg`.
- `robots.txt`: `Disallow: /admin`, `Disallow: /api`; `Sitemap: <SITE_URL>/sitemap.xml`. Si `SITE_URL` termina en `.vercel.app` y `ALLOW_INDEXING` no es `true`, `Disallow: /` (evitar indexar el subdominio de prueba antes del lanzamiento).
- `SITE_URL` desde variable de entorno; cambiar de dominio no requiere cambios de código.
- Analítica: `ANALYTICS_PROVIDER=vercel|umami|none`; nunca cookies.
- Presupuestos (móvil, Lighthouse): LCP < 2.5 s, CLS < 0.1, TBT < 300 ms, Accesibilidad ≥ 95, SEO = 100 en home, ficha de peleador y página de evento.

## Review Focus

- Nombre con comillas o tildes en título/descripción (`Matías "El Toro" Pérez`) debe escaparse bien en meta tags y JSON-LD.
- Evento cancelado: JSON-LD con `eventStatus: EventCancelled`; evento pasado sigue indexable.
- Contenido en borrador nunca aparece en el sitemap ni tiene JSON-LD accesible por URL directa.
- Canonical sin parámetros de filtro (`/peleadores?division=…` → canonical `/peleadores`).
- Previsualización de admin (`?preview=`) devuelve `noindex`.

---

### Task 1: Helpers de SEO y JSON-LD

**Files:**
- Create: `src/domain/seo.ts`, `src/domain/seo.test.ts`, `src/components/seo/json-ld.tsx`

**Interfaces:**
- Produces:
  - `truncateDescription(text: string, max = 160): string`
  - `pageMetadata(input: { title: string; description: string; path: string; ogImageUrl: string; noindex?: boolean }): Metadata`
  - `eventJsonLd(e: EventPageDTO, siteUrl): WithContext<SportsEvent>` (name, startDate ISO con offset, endDate, eventStatus, eventAttendanceMode Offline, location Place+PostalAddress, image, organizer Organization, offers desde `ticket_tiers` con `priceCurrency: 'CLP'` y `availability` InStock/SoldOut, competitor = peleadores de la pelea estelar)
  - `fighterJsonLd(f: FighterProfileDTO, siteUrl): WithContext<Person>` (name, alternateName = apodo, nationality, height, weight, image, sameAs = redes)
  - `articleJsonLd(p: PostDTO, siteUrl): WithContext<NewsArticle>`
  - `organizationJsonLd(settings, siteUrl): WithContext<Organization>`
  - `<JsonLd data />` — `<script type="application/ld+json">` con `JSON.stringify` y `<` escapado como `<`.

- [ ] **Step 1: Tests que fallan:** `truncateDescription` corta en palabra y agrega "…" sin pasar de 160; `eventJsonLd` de evento cancelado → `eventStatus: 'https://schema.org/EventCancelled'`; tramo agotado → `availability: 'https://schema.org/SoldOut'`; `fighterJsonLd` con apodo con comillas produce JSON válido; `JsonLd` escapa `</script>`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `feat(seo): metadata and json-ld helpers`

### Task 2: Metadatos por página

**Files:**
- Modify: `generateMetadata` en `src/app/(site)/**/page.tsx` (home, eventos, evento, peleadores, peleador, rankings, noticias, noticia, entradas, quiero-pelear, patrocinar, nosotros, contacto, privacidad); `src/app/(site)/layout.tsx` (`metadataBase`, plantilla de título, verificación de Google desde settings, `<html lang="es-CL">`)
- Test: `e2e/seo.spec.ts`

- [ ] **Step 1: Test e2e que falla:** cada ruta pública tiene `<title>` único con plantilla, `meta[name=description]`, `link[rel=canonical]` sin query, `og:image`; ficha de peleador y evento tienen JSON-LD parseable del tipo correcto; `?preview=` agrega `noindex`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `feat(seo): per-page metadata and structured data`

### Task 3: Sitemap y robots

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/features/seo/sitemap-entries.ts`, `sitemap-entries.test.ts`

**Interfaces:**
- Produces: `getSitemapEntries(db, siteUrl): Promise<MetadataRoute.Sitemap>` — rutas fijas + peleadores, eventos y noticias públicos con `lastModified = updated_at`.

- [ ] **Step 1: Tests que fallan:** entradas incluyen `/peleadores/matias-perez`, excluyen borradores, programados futuros y papelera; `robots` con `SITE_URL=https://gc.vercel.app` y sin `ALLOW_INDEXING` → `disallow: '/'`; con `ALLOW_INDEXING=true` → solo `/admin` y `/api`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `feat(seo): dynamic sitemap and robots`

### Task 4: Analítica sin cookies

**Files:**
- Create: `src/components/analytics.tsx`
- Modify: `src/app/(site)/layout.tsx`

**Interfaces:**
- Produces: `<Analytics />` según `ANALYTICS_PROVIDER` (`vercel` → `@vercel/analytics/react`; `umami` → script `UMAMI_SRC` con `data-website-id`; `none` → nada). No se incluye en `/admin`.

- [ ] **Step 1:** Implementar. **Verificación:** con `ANALYTICS_PROVIDER=none` el HTML no contiene scripts de analítica; con `vercel` aparece; en `/admin` nunca. Ninguna cookie nueva en `document.cookie` tras navegar.
- [ ] **Step 2: Commit** `feat: cookieless analytics`

### Task 5: Rendimiento y accesibilidad

**Files:**
- Create: `lighthouserc.json`, `e2e/a11y.spec.ts`
- Modify: componentes según hallazgos

- [ ] **Step 1: Test que falla:** `e2e/a11y.spec.ts` corre axe en home, `/peleadores`, ficha, `/eventos/<slug>`, `/rankings`, `/noticias/<slug>`, `/quiero-pelear`, `/admin/login`: 0 violaciones `serious`/`critical`.
- [ ] **Step 2:** Corregir hasta PASS (contraste amarillo sobre blanco solo en textos grandes, foco visible, `aria-label` en controles de ícono, orden de encabezados).
- [ ] **Step 3:** `pnpm build && pnpm start` + `lhci autorun` con los presupuestos de Global Constraints en perfil móvil. Corregir (imagen del hero con `priority` y `fetchPriority`, GSAP/Lenis cargados en cliente de forma diferida, fuentes con `display: swap`) hasta cumplir.
- [ ] **Step 4: Commit** `perf/a11y: meet lighthouse budgets and axe checks`

### Task 6: Despliegue en Vercel

**Files:**
- Create: `docs/deploy.md`, `.env.example` (completo y comentado)
- Modify: `package.json` (`"vercel-build": "pnpm db:migrate && next build"`)

- [ ] **Step 1:** Ejecutar con el usuario siguiendo `docs/configuracion-externa.md` (Google y Resend ya están documentados ahí; completar el resto) (cada servicio lo crea el usuario con su cuenta): Postgres (Neon o Supabase, solo cadena de conexión), bucket R2 con dominio público, dominio de envío en Resend, credenciales OAuth de Google (redirect `https://<SITE_URL>/api/auth/callback/google`), `BETTER_AUTH_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`, `SITE_URL`, `ANALYTICS_PROVIDER=vercel`, `STORAGE_DRIVER=s3`, `MAIL_DRIVER=resend`, `RESEND_API_KEY`, `MAIL_FROM`. Con Google configurado, el botón aparece solo.
- [ ] **Step 2:** Primer deploy; `scripts/create-admin.ts` contra producción para el email de la promotora.
- [ ] **Step 3: Verificación (smoke test en producción):** login admin, subir foto, crear peleador borrador, previsualizar, publicar, verlo en el sitio; enviar formulario y recibir email; `/sitemap.xml` y `/robots.txt` responden; cron de purga responde 401 sin secreto.
- [ ] **Step 4: Commit** `docs: deployment guide`

### Task 7: Guías de operación y migración a VPS

**Files:**
- Create: `docs/guia-admin.md` (para la promotora: cómo crear evento, armar cartelera, noche de pelea, cargar resultados, rankings, noticias, formatos de imagen con la tabla del spec, papelera)
- Create: `docs/vps-migration.md`, `deploy/docker-compose.prod.yml` (app Next standalone, postgres:17, minio, umami, caddy con HTTPS), `deploy/Dockerfile`, `deploy/cron` (purga diaria con `curl` + `CRON_SECRET`)

- [ ] **Step 1:** `next.config.ts` con `output: 'standalone'`; `docker compose -f deploy/docker-compose.prod.yml up` levanta el sitio localmente con MinIO y `STORAGE_DRIVER=s3` apuntando a MinIO. **Verificación:** home carga e imágenes se sirven desde MinIO.
- [ ] **Step 2:** Documentar migración: `pg_dump`/`pg_restore`, `rclone sync` R2 → MinIO, cambio de DNS, variables a cambiar.
- [ ] **Step 3: Commit** `docs: admin guide and vps migration path`

### Task 8: Lanzamiento

- [ ] **Step 1:** La promotora carga contenido real desde el panel (peleadores, eventos pasados con resultados, próximo evento, noticias, patrocinadores, configuración). Borrar datos seed de producción (el seed nunca corre en producción; verificar).
- [ ] **Step 2:** Revisión final con `/rankings`, fichas y eventos reales; corregir textos.
- [ ] **Step 3:** `ALLOW_INDEXING=true`, verificar dominio en Search Console, enviar sitemap.
- [ ] **Step 4:** Anuncio en redes con link. Tag `v1.0.0`.
