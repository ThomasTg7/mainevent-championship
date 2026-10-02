import { unstable_cache } from "next/cache";
import { db } from "@/db";
import type { BoutLevel } from "@/domain/bout-enums";
import { DIVISIONS_CACHE_TAG } from "@/features/divisions/cache";
import { FIGHTERS_LIST_TAG, fighterCacheTag } from "@/features/fighters/cache";
import { MEDIA_ANY_TAG } from "@/features/media/cache";
import { RANKINGS_TAG } from "./cache";
import { getFighterRankingTags, getPublicRankings } from "./queries";

// Lecturas del sitio público cacheadas con etiquetas. Las fechas van como ISO (la caché serializa en JSON).

// Tope de tiempo: cubre lo que ninguna action dispara (un peleador programado que llega a su fecha de publicación).
const REVALIDATE_SECONDS = 300;

/** `/rankings` de un nivel: los nombres y las fotos de los peleadores y los nombres de las divisiones también lo invalidan. */
export function getCachedPublicRankings(level: BoutLevel) {
  return unstable_cache(() => getPublicRankings(db, level), ["rankings-page", level], {
    tags: [RANKINGS_TAG, DIVISIONS_CACHE_TAG, FIGHTERS_LIST_TAG, MEDIA_ANY_TAG],
    revalidate: REVALIDATE_SECONDS,
  })();
}

/**
 * Etiquetas de campeón y ranking de la ficha. Van aparte de la caché de la ficha (`fighter:<id>` y `rankings`) para que
 * guardar un ranking no obligue a releer toda la ficha ni al revés.
 */
export function getCachedFighterRankingTags(fighterId: string) {
  return unstable_cache(() => getFighterRankingTags(db, fighterId), ["fighter-ranking-tags", fighterId], {
    tags: [RANKINGS_TAG, fighterCacheTag(fighterId), DIVISIONS_CACHE_TAG],
    revalidate: REVALIDATE_SECONDS,
  })();
}
