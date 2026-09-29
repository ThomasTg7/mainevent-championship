import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { DIVISIONS_CACHE_TAG } from "@/features/divisions/cache";
import { MEDIA_ANY_TAG, mediaCacheTag } from "@/features/media/cache";
import { FIGHTERS_LIST_TAG, fighterCacheTag } from "./cache";
import { getPublicFighterBySlug, getPublicFighterRef, listPublicFighters, listPublicFilterOptions } from "./queries";
import type { FighterFilters } from "./schema";

// Lecturas del sitio público, cacheadas con etiquetas para invalidarlas desde la action que escribe.
// El servicio de cada página decide `preview`: la vista previa nunca pasa por aquí.

// Un tope de tiempo cubre lo que ninguna action dispara: peleadores programados que llegan a su fecha.
const REVALIDATE_SECONDS = 300;

/**
 * Las búsquedas de texto van directo a la base: cada texto (y cada letra que se escribe) sería una entrada de caché
 * de un solo uso. Los filtros de las listas tienen pocas combinaciones y sí se cachean.
 */
export function getCachedPublicFighters(filters: FighterFilters, page: number) {
  if (filters.q) return listPublicFighters(db, filters, { page });
  return unstable_cache(() => listPublicFighters(db, filters, { page }), ["fighters-list", JSON.stringify(filters), String(page)], {
    tags: [FIGHTERS_LIST_TAG, DIVISIONS_CACHE_TAG, MEDIA_ANY_TAG],
    revalidate: REVALIDATE_SECONDS,
  })();
}

export function getCachedPublicFilterOptions() {
  return unstable_cache(() => listPublicFilterOptions(db), ["fighters-filter-options"], {
    tags: [FIGHTERS_LIST_TAG, DIVISIONS_CACHE_TAG],
    revalidate: REVALIDATE_SECONDS,
  })();
}

/**
 * Ficha pública. Primero una lectura mínima (sin caché) decide si el peleador es público *ahora*: así un borrador,
 * uno en la papelera o uno programado nunca se sirve desde la caché. Con el id conocido se cachea el resto con
 * las etiquetas del peleador y de sus imágenes.
 */
export async function getCachedPublicFighter(slug: string) {
  const ref = await getPublicFighterRef(db, slug);
  if (!ref) return null;

  const mediaTags = [ref.bodyMediaId, ref.headshotMediaId].flatMap((id) => (id ? [mediaCacheTag(id)] : []));
  return unstable_cache(() => getPublicFighterBySlug(db, slug), ["fighter-profile", ref.id, slug], {
    tags: [fighterCacheTag(ref.id), DIVISIONS_CACHE_TAG, ...mediaTags],
    revalidate: REVALIDATE_SECONDS,
  })();
}
