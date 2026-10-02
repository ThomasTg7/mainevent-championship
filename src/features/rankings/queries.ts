import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { bouts } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import { rankingEntries, titles } from "@/db/schema/rankings";
import type { BoutLevel } from "@/domain/bout-enums";
import { P4P_SLOTS, computeMovement } from "@/domain/rankings";
import { divisionTitle } from "@/features/fighters/labels";
import type { MediaDTO } from "@/features/media/dto";
import { getMediaByIds } from "@/features/media/queries";
import type { RankedFighterDTO, RankingCardDTO, RankingsPageDTO } from "./dto";
import { visibleRankedFighter } from "./eligibility";
import { listLatestVersions } from "./versions";

// Lecturas públicas de rankings. Un peleador que ya no se ve (retirado, inactivo, borrador, en la papelera) no aparece:
// los puestos se muestran compactados y el movimiento se calcula sobre esas mismas listas (versión vigente contra la anterior).

const fighterColumns = {
  id: fighters.id,
  slug: fighters.slug,
  firstName: fighters.firstName,
  lastName: fighters.lastName,
  nationality: fighters.nationality,
  bodyMediaId: fighters.bodyMediaId,
  proWins: fighters.proWins,
  proLosses: fighters.proLosses,
  proDraws: fighters.proDraws,
  proNoContests: fighters.proNoContests,
  amWins: fighters.amWins,
  amLosses: fighters.amLosses,
  amDraws: fighters.amDraws,
  amNoContests: fighters.amNoContests,
};

type FighterRow = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nationality: string;
  bodyMediaId: string | null;
  proWins: number;
  proLosses: number;
  proDraws: number;
  proNoContests: number;
  amWins: number;
  amLosses: number;
  amDraws: number;
  amNoContests: number;
};

function toRankedFighter(row: FighterRow, level: BoutLevel, withPhoto: boolean, mediaById: Map<string, MediaDTO>): RankedFighterDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: `${row.firstName} ${row.lastName}`,
    nationality: row.nationality,
    record:
      level === "pro"
        ? { wins: row.proWins, losses: row.proLosses, draws: row.proDraws, noContests: row.proNoContests }
        : { wins: row.amWins, losses: row.amLosses, draws: row.amDraws, noContests: row.amNoContests },
    bodyMedia: withPhoto && row.bodyMediaId ? (mediaById.get(row.bodyMediaId) ?? null) : null,
  };
}

/** Clave del alcance dentro de un nivel: el id de la división o `p4p`. */
const scopeKeyOf = (divisionId: string | null) => divisionId ?? "p4p";

type PublicScope = { divisionId: string | null; slots: number; division: RankingCardDTO["division"] };

/**
 * Rankings públicos de un nivel: libra por libra primero y luego las divisiones activas en su orden, cada una con su
 * campeón, sus puestos con movimiento y la fecha de la versión vigente. Sin campeón ni puestos, la división no sale.
 * Consultas fijas (divisiones, títulos y versiones; puestos y campeones; imágenes), sin una por división.
 */
export async function getPublicRankings(db: Db, level: BoutLevel): Promise<RankingsPageDTO> {
  const [divisionRows, titleRows, versionRows] = await Promise.all([
    db.select().from(divisions).where(eq(divisions.active, true)).orderBy(asc(divisions.gender), asc(divisions.sortOrder)),
    db.select({ divisionId: titles.divisionId, championId: titles.championFighterId, since: titles.since }).from(titles).where(eq(titles.level, level)),
    listLatestVersions(db, { level }, 2),
  ]);

  const versionIds = versionRows.map((version) => version.id);
  const championIds = titleRows.flatMap((title) => (title.championId ? [title.championId] : []));
  const [entryRows, championRows] = await Promise.all([
    versionIds.length === 0
      ? []
      : db
          .select({ versionId: rankingEntries.versionId, fighter: fighterColumns })
          .from(rankingEntries)
          .innerJoin(fighters, eq(fighters.id, rankingEntries.fighterId))
          .where(and(inArray(rankingEntries.versionId, versionIds), visibleRankedFighter))
          .orderBy(asc(rankingEntries.versionId), asc(rankingEntries.position)),
    championIds.length === 0 ? [] : db.select(fighterColumns).from(fighters).where(and(inArray(fighters.id, championIds), visibleRankedFighter)),
  ]);

  const championById = new Map(championRows.map((row) => [row.id, row]));
  const titleOf = new Map(titleRows.map((title) => [scopeKeyOf(title.divisionId), title]));
  const fightersOfVersion = new Map<string, FighterRow[]>();
  for (const entry of entryRows) fightersOfVersion.set(entry.versionId, [...(fightersOfVersion.get(entry.versionId) ?? []), entry.fighter]);

  const scopes: PublicScope[] = [
    { divisionId: null, slots: P4P_SLOTS, division: null },
    ...divisionRows.map((division) => ({
      divisionId: division.id,
      slots: division.rankingSlots,
      division: { id: division.id, name: division.name, slug: division.slug, gender: division.gender },
    })),
  ];

  const drafts = scopes.flatMap((scope) => {
    const key = scopeKeyOf(scope.divisionId);
    const title = titleOf.get(key);
    const championRow = title?.championId ? championById.get(title.championId) : undefined;
    const versionOfRank = (rank: number) => versionRows.find((version) => scopeKeyOf(version.divisionId) === key && version.rank === rank);
    // El campeón no ocupa número: aunque una versión vieja lo traiga, no se cuenta (ni en la vigente ni en la anterior).
    const withoutChampion = (versionId: string | undefined) =>
      versionId ? (fightersOfVersion.get(versionId) ?? []).filter((row) => row.id !== title?.championId) : null;
    const current = versionOfRank(1);
    const currentRows = withoutChampion(current?.id)?.slice(0, scope.slots) ?? [];
    if (!championRow && currentRows.length === 0) return [];
    const previousRows = withoutChampion(versionOfRank(2)?.id);
    return [{ scope, title, championRow, currentRows, updatedAt: current?.createdAt ?? null, previousIds: previousRows ? previousRows.map((row) => row.id) : null }];
  });

  // Solo el campeón y el líder del libra por libra muestran foto: se piden juntas, en una consulta.
  const photoIds = drafts.flatMap((draft) => {
    const leader = draft.scope.divisionId === null ? draft.currentRows[0] : undefined;
    return [draft.championRow?.bodyMediaId, leader?.bodyMediaId].flatMap((id) => (id ? [id] : []));
  });
  const mediaById = await getMediaByIds(db, [...new Set(photoIds)]);

  return {
    level,
    cards: drafts.map((draft): RankingCardDTO => {
      const movement = computeMovement(
        draft.currentRows.map((row) => row.id),
        draft.previousIds,
      );
      return {
        level,
        division: draft.scope.division,
        champion: draft.championRow ? { ...toRankedFighter(draft.championRow, level, true, mediaById), since: draft.title?.since ?? null } : null,
        entries: draft.currentRows.map((row, index) => ({
          position: index + 1,
          fighter: toRankedFighter(row, level, draft.scope.divisionId === null && index === 0, mediaById),
          movement: movement.get(row.id) ?? { kind: "new" },
        })),
        updatedAt: draft.updatedAt ? draft.updatedAt.toISOString() : null,
      };
    }),
  };
}

const LEVEL_SUFFIX: Record<BoutLevel, string> = { pro: "", amateur: " · Amateur" };
const proFirst = (a: { level: BoutLevel }, b: { level: BoutLevel }) => (a.level === b.level ? 0 : a.level === "pro" ? -1 : 1);

/**
 * Etiquetas de campeón y ranking de un peleador para su ficha, ya listas para mostrar: primero los títulos, luego los
 * puestos de división y al final el libra por libra (pro antes que amateur). Un peleador que no está activo no lleva ninguna.
 */
export async function getFighterRankingTags(db: Db, fighterId: string): Promise<{ label: string }[]> {
  const [fighter] = await db.select({ careerStatus: fighters.careerStatus }).from(fighters).where(eq(fighters.id, fighterId)).limit(1);
  if (fighter?.careerStatus !== "active") return [];

  const latest = await listLatestVersions(db, {}, 1);
  const [titleRows, entryRows, divisionRows] = await Promise.all([
    db
      .select({ level: titles.level, name: divisions.name, gender: divisions.gender })
      .from(titles)
      .innerJoin(divisions, eq(divisions.id, titles.divisionId))
      .where(eq(titles.championFighterId, fighterId)),
    latest.length === 0
      ? []
      : db
          .select({ versionId: rankingEntries.versionId, position: rankingEntries.position })
          .from(rankingEntries)
          .where(and(eq(rankingEntries.fighterId, fighterId), inArray(rankingEntries.versionId, latest.map((version) => version.id)))),
    db.select({ id: divisions.id, name: divisions.name, gender: divisions.gender }).from(divisions),
  ]);
  const divisionById = new Map(divisionRows.map((division) => [division.id, division]));
  const versionById = new Map(latest.map((version) => [version.id, version]));

  const champion = titleRows.toSorted(proFirst).map((title) => `Campeón ${title.level === "pro" ? "pro" : "amateur"} · ${divisionTitle(title)}`);
  const ranked = entryRows.flatMap((entry) => {
    const version = versionById.get(entry.versionId);
    if (!version) return [];
    const division = version.divisionId ? divisionById.get(version.divisionId) : null;
    const place = division ? divisionTitle(division) : "P4P";
    return [{ level: version.level, p4p: version.divisionId === null, label: `#${entry.position} ${place}${LEVEL_SUFFIX[version.level]}` }];
  });
  // Los puestos de división van antes que el libra por libra.
  const rankLabels = ranked.toSorted((a, b) => Number(a.p4p) - Number(b.p4p) || proFirst(a, b)).map((entry) => entry.label);
  return [...champion, ...rankLabels].map((label) => ({ label }));
}

/**
 * Etiqueta de cada peleador de unas peleas según su división y nivel de hoy: `"C"` (campeón) o `"#n"`. Las peleas sin
 * división (peso pactado) y quien ya no está activo no llevan etiqueta. Una consulta por tipo de dato, nunca por pelea.
 */
export async function getBoutRankLabels(db: Db, boutIds: string[]): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (boutIds.length === 0) return labels;
  const boutRows = await db
    .select({ level: bouts.level, divisionId: bouts.divisionId, red: bouts.redFighterId, blue: bouts.blueFighterId })
    .from(bouts)
    .where(and(inArray(bouts.id, boutIds), isNotNull(bouts.divisionId)));
  if (boutRows.length === 0) return labels;

  const divisionIds = [...new Set(boutRows.flatMap((bout) => (bout.divisionId ? [bout.divisionId] : [])))];
  const fighterIds = [...new Set(boutRows.flatMap((bout) => [bout.red, bout.blue]))];
  const [activeRows, titleRows, latest] = await Promise.all([
    db.select({ id: fighters.id }).from(fighters).where(and(inArray(fighters.id, fighterIds), eq(fighters.careerStatus, "active"))),
    db.select({ level: titles.level, divisionId: titles.divisionId, championId: titles.championFighterId }).from(titles).where(inArray(titles.divisionId, divisionIds)),
    listLatestVersions(db, {}, 1),
  ]);
  const active = new Set(activeRows.map((row) => row.id));
  const versionOf = new Map(latest.flatMap((version) => (version.divisionId ? [[`${version.level}:${version.divisionId}`, version.id] as const] : [])));
  const versionIds = [...new Set(boutRows.flatMap((bout) => versionOf.get(`${bout.level}:${bout.divisionId}`) ?? []))];
  const entryRows =
    versionIds.length === 0
      ? []
      : await db
          .select({ versionId: rankingEntries.versionId, position: rankingEntries.position, fighterId: rankingEntries.fighterId })
          .from(rankingEntries)
          .where(and(inArray(rankingEntries.versionId, versionIds), inArray(rankingEntries.fighterId, fighterIds)));

  for (const bout of boutRows) {
    const championId = titleRows.find((title) => title.level === bout.level && title.divisionId === bout.divisionId)?.championId;
    const versionId = versionOf.get(`${bout.level}:${bout.divisionId}`);
    for (const fighterId of [bout.red, bout.blue]) {
      if (!active.has(fighterId)) continue;
      if (championId === fighterId) labels.set(fighterId, "C");
      else {
        const entry = entryRows.find((row) => row.versionId === versionId && row.fighterId === fighterId);
        if (entry) labels.set(fighterId, `#${entry.position}`);
      }
    }
  }
  return labels;
}
