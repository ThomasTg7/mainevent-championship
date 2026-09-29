# Reporte — Plan 02 · Peleadores y divisiones

Rama `plan-02` (desde `main`). Ejecutado con `superpowers:executing-plans` (inline). Un commit por tarea.

## Tareas completadas

| Tarea | Resultado |
|---|---|
| 1 Unidades y edad | `src/domain/units.ts` (kg↔lb, cm↔pies, edad con 29 de febrero, país en español) |
| 3 Slugs (antes de la 2) | `src/domain/slug.ts` |
| 2 Divisiones | tabla `divisions`, seed idempotente (12), servicio, admin `/admin/divisiones` (arrastrar + subir/bajar, activar, formulario en diálogo) |
| 4 Peleadores — esquema y datos | tabla `fighters`, Zod, consultas (público/admin/edición), servicio, seed de 12, papelera registrada, guarda de divisiones, `assertUsableMedia` |
| 4b Dueños de las imágenes | `MEDIA_REFERENCES` + test que exige registrar toda FK a `media`, `purgeUnreferencedMedia`, cron |
| 5 Publicación | `PublicationControls`, `PublicationBadge`, tokens de vista previa (HMAC, 1 h, ligados a la entidad), `santiago-time` |
| 6 Admin de peleadores | listado (filtros, tarjetas en móvil), formulario con 6 pestañas, fotos con `MediaField`, papelera y restaurar |
| 7 Récord calculado | `src/domain/record.ts` (puro, 100 % testeado) |
| 8 Listado público | `/peleadores` con filtros en URL, tarjetas, silueta sin foto, paginación de 24 |
| 9 Ficha pública | `/peleadores/[slug]` (hero, récord, Bio/Datos/Redes, 404 útil, vista previa) |

## Desviaciones

Todas registradas en [`docs/decisions.md`](../decisions.md) → «Ejecución del Plan 02 (Sonnet)». Las que más afectan a lo siguiente:

- Caché pública con `unstable_cache` + `updateTag` (no `revalidateTag(…, "max")`) y tags `fighter:<id>`, `divisions`, `media`; la papelera invalida al restaurar. Patrón a repetir en Planes 03–06.
- Hero de la ficha: cifras Victorias/Derrotas/Empates (manual). Plan 03 debe pasar `computed` a `RecordSummary` y cambiar `figures` a KO/TKO, Sumisión, Victorias; llenar el hueco `data-slot="fighter-history"`.
- `listPublicFighters` devuelve `{ items, hasMore }`.
- Servicios con auditoría dentro (`service.ts`) y `UserFacingError`, siguiendo `docs/convenciones.md`.

## Pendientes

- Revisión de código final con contexto nuevo (Fase 2 del flujo, Opus): no se lanzó revisor aparte.
- Búsqueda con `LIKE` sobre `search_text` (sin índice trigram): suficiente hasta ~500 peleadores.
- Planes 03/04/06 registran sus FK a imágenes en `MEDIA_REFERENCES`; Plan 05 llena etiquetas de ranking (`data-slot="fighter-tags"`); Plan 04 noticias (`fighter-news`); Plan 07 sitemap de peleadores con `publicScope`.
- Las publicaciones programadas aparecen con hasta 5 min de retraso en el listado (tope de la caché).

## Verificación

Todo en verde al cerrar (comandos abajo): `pnpm test` (279 tests, 43 archivos), `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e` (48 tests) y `E2E_DIST_DIR=.next-e2e pnpm build`.

## Cómo probar

```bash
pnpm db:migrate   # migraciones 0006 (divisiones) y 0007 (peleadores)
pnpm db:seed      # 12 divisiones y 12 peleadores de ejemplo
pnpm dev          # o el que ya tienes abierto en :3000
```

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm test:e2e
```

## Qué mirar (en 375 px y 1440 px)

Panel (entrar a `/admin/login`):
1. `/admin/divisiones`: filas con arrastre, flechas subir/bajar, interruptor «Activa», «Nueva división»; intentar poner 0 kg.
2. `/admin/peleadores`: filtros (2 columnas en móvil), tarjetas en móvil y tabla en PC, «Publicar / Pasar a borrador / Papelera».
3. `/admin/peleadores/nuevo`: enviar vacío (errores junto al campo y pestaña con punto rojo), pestaña Fotos (subir foto, recortar), pestaña Publicación (Programar sin fecha deshabilita «Crear peleador»), botón fijo abajo en móvil.
4. Editar un peleador: «Vista previa» abre la ficha en otra pestaña (aunque sea borrador); renombrar no cambia el enlace.
5. `/admin/papelera`: enviar un peleador y restaurarlo; se oculta/muestra al instante en el sitio.

Sitio público:
1. `/peleadores`: buscar «perez», «TORO», «leona» (sin tildes/mayúsculas), filtros de división, país, género y estado (por defecto solo activos), silueta sin foto, contadores de récord.
2. `/peleadores/matias-perez`: hero, cifras, récord pro/amateur por separado, pestañas Bio/Datos/Redes.
3. `/peleadores/no-existe` y un borrador: 404 con mensaje.
4. Con «reducir movimiento» activado en el sistema: las cifras aparecen finales, sin conteo.
