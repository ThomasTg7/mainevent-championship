import { BOUT_LEVEL_SLUGS, type BoutLevel } from "@/domain/bout-enums";

/**
 * `?disciplina=kickboxing` es el ranking de Kickboxing; cualquier otro valor (o ninguno) es el de Muay Thai. El antiguo
 * `?nivel=amateur` sigue llevando a Kickboxing para no romper enlaces guardados.
 */
export function parseRankingLevel(discipline: string | string[] | undefined, legacyLevel?: string | string[]): BoutLevel {
  return discipline === BOUT_LEVEL_SLUGS.amateur || legacyLevel === "amateur" ? "amateur" : "pro";
}

/** Cada disciplina es una página distinta (otro contenido): la URL de Kickboxing lleva su parámetro. */
export function rankingsHref(level: BoutLevel): string {
  return level === "amateur" ? `/rankings?disciplina=${BOUT_LEVEL_SLUGS.amateur}` : "/rankings";
}
