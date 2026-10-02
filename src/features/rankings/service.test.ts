import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { dismissedSuggestions, rankingEntries, rankingVersions, titles } from "@/db/schema/rankings";
import { deleteFighter, updateFighter } from "@/features/fighters/service";
import { createTestDb } from "@/test/db";
import { dismissSuggestion, saveRanking, setChampion, vacateTitle } from "./service";
import { divisionIdBySlug, insertRankableFighter } from "./test-helpers";
import { getCurrentRanking } from "./versions";
import { getFighterRankingStanding, listIneligibleWarnings } from "./warnings";
import { getPublicRankings } from "./queries";
import { insertEvent } from "@/features/events/test-helpers";

let db: Db;
let close: () => Promise<void>;
let ligero: string;
let paja: string;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  ligero = await divisionIdBySlug(db, "peso-ligero");
  paja = await divisionIdBySlug(db, "peso-paja-femenino");
});
afterAll(() => close());

const scope = (divisionId: string | null, level: "pro" | "amateur" = "pro") => ({ level, divisionId });
const fighter = (divisionId = ligero, overrides: Parameters<typeof insertRankableFighter>[2] = {}) => insertRankableFighter(db, divisionId, overrides);

async function versionCount(divisionId: string): Promise<number> {
  const rows = await db.select({ id: rankingVersions.id }).from(rankingVersions).where(and(eq(rankingVersions.level, "pro"), eq(rankingVersions.divisionId, divisionId)));
  return rows.length;
}

describe("saveRanking", () => {
  it("creates a new immutable version on every save", async () => {
    const [a, b, c] = [await fighter(paja, { gender: "female" }), await fighter(paja, { gender: "female" }), await fighter(paja, { gender: "female" })];
    const before = await versionCount(paja);
    const first = await saveRanking(db, scope(paja), [a, b], "admin-1");
    const second = await saveRanking(db, scope(paja), [b, a, c], "admin-1");
    expect(await versionCount(paja)).toBe(before + 2);
    expect(first.versionId).not.toBe(second.versionId);
    const stored = await db.select({ fighterId: rankingEntries.fighterId }).from(rankingEntries).where(eq(rankingEntries.versionId, first.versionId)).orderBy(rankingEntries.position);
    expect(stored.map((row) => row.fighterId)).toEqual([a, b]);
    expect((await getCurrentRanking(db, scope(paja)))?.fighterIds).toEqual([b, a, c]);
  });

  it("reports who enters, leaves or moves so their pages can be refreshed", async () => {
    const [a, b, c] = [await fighter(), await fighter(), await fighter()];
    await saveRanking(db, scope(null), [a, b], "admin-1");
    const change = await saveRanking(db, scope(null), [b, c], "admin-1");
    expect(new Set(change.affectedFighterIds)).toEqual(new Set([a, b, c]));
  });

  it("rejects more entries than the division's slots", async () => {
    const six = await Promise.all([1, 2, 3, 4, 5, 6].map(() => fighter(ligero)));
    await expect(saveRanking(db, scope(ligero), six, "admin-1")).rejects.toThrow("Máximo 5 puestos");
  });

  it("rejects a repeated fighter", async () => {
    const a = await fighter();
    await expect(saveRanking(db, scope(null), [a, a], "admin-1")).rejects.toThrow("Peleador repetido");
  });

  it("rejects a fighter of the other gender, naming them", async () => {
    const woman = await fighter(paja, { gender: "female", firstName: "Ana", lastName: "Mujer" });
    await expect(saveRanking(db, scope(ligero), [woman], "admin-1")).rejects.toThrow("Ana Mujer no es elegible");
  });

  it("rejects a fighter who is not active", async () => {
    const retired = await fighter(ligero, { careerStatus: "retired", firstName: "Rita", lastName: "Retirada" });
    await expect(saveRanking(db, scope(ligero), [retired], "admin-1")).rejects.toThrow("Rita Retirada no es elegible");
  });

  it("rejects a fighter with no fights or record at the level", async () => {
    const amateurOnly = await fighter(ligero, { level: "amateur" });
    await expect(saveRanking(db, scope(ligero, "pro"), [amateurOnly], "admin-1")).rejects.toThrow("no es elegible");
    await expect(saveRanking(db, scope(ligero, "amateur"), [amateurOnly], "admin-1")).resolves.toBeDefined();
  });

  it("rejects an unknown division and audits a valid save", async () => {
    await expect(saveRanking(db, scope("00000000-0000-4000-8000-000000000000"), [], "admin-1")).rejects.toThrow("No se encontró la división");
    const a = await fighter();
    const { versionId } = await saveRanking(db, scope(null), [a], "admin-1");
    const [log] = await db.select().from(auditLog).where(eq(auditLog.entityId, versionId));
    expect(log).toMatchObject({ actorId: "admin-1", entityType: "ranking", action: "create" });
  });
});

describe("setChampion", () => {
  it("crowns a ranked fighter, removing them from the numbered ranking, and then saving with them fails", async () => {
    const division = await divisionIdBySlug(db, "peso-welter");
    const [a, b, c] = [await fighter(division), await fighter(division), await fighter(division)];
    await saveRanking(db, scope(division), [a, b, c], "admin-1");

    await setChampion(db, "pro", division, b, "admin-1");

    expect((await getCurrentRanking(db, scope(division)))?.fighterIds).toEqual([a, c]);
    await expect(saveRanking(db, scope(division), [a, b, c], "admin-1")).rejects.toThrow("El campeón no puede estar en el ranking numerado");
    await expect(saveRanking(db, scope(division), [c, a], "admin-1")).resolves.toBeDefined();
  });

  it("puts the former champion at #1 when they are still eligible", async () => {
    const division = await divisionIdBySlug(db, "peso-gallo");
    const [old, challenger, other] = [await fighter(division), await fighter(division), await fighter(division)];
    await setChampion(db, "pro", division, old, "admin-1");
    await saveRanking(db, scope(division), [challenger, other], "admin-1");

    await setChampion(db, "pro", division, challenger, "admin-1");

    expect((await getCurrentRanking(db, scope(division)))?.fighterIds).toEqual([old, other]);
    const [title] = await db.select().from(titles).where(and(eq(titles.divisionId, division), eq(titles.level, "pro")));
    expect(title?.championFighterId).toBe(challenger);
  });

  it("does not rank a former champion who is no longer eligible", async () => {
    const division = await divisionIdBySlug(db, "peso-mosca");
    const [old, challenger] = [await fighter(division), await fighter(division)];
    await setChampion(db, "pro", division, old, "admin-1");
    await updateFighter(db, old, { firstName: "X", lastName: "Y", gender: "male", nationality: "CL", divisionId: division, careerStatus: "retired", proWins: 3 }, "admin-1");

    await setChampion(db, "pro", division, challenger, "admin-1");

    expect((await getCurrentRanking(db, scope(division)))?.fighterIds ?? []).toEqual([]);
  });

  it("is a no-op for the current champion and keeps one title per division and level", async () => {
    const division = await divisionIdBySlug(db, "peso-pesado");
    const a = await fighter(division);
    await setChampion(db, "pro", division, a, "admin-1");
    expect((await setChampion(db, "pro", division, a, "admin-1")).affectedFighterIds).toEqual([]);
    const rows = await db.select().from(titles).where(eq(titles.divisionId, division));
    expect(rows).toHaveLength(1);
  });

  it("rejects an ineligible champion", async () => {
    const woman = await fighter(paja, { gender: "female" });
    await expect(setChampion(db, "pro", ligero, woman, "admin-1")).rejects.toThrow("no puede ser campeón");
  });

  it("keeps pro and amateur titles independent", async () => {
    const division = await divisionIdBySlug(db, "peso-medio");
    const [pro, amateur] = [await fighter(division), await fighter(division, { level: "amateur" })];
    await setChampion(db, "pro", division, pro, "admin-1");
    await setChampion(db, "amateur", division, amateur, "admin-1");
    const rows = await db.select().from(titles).where(eq(titles.divisionId, division));
    expect(rows.map((row) => [row.level, row.championFighterId]).sort()).toEqual([["amateur", amateur], ["pro", pro]].sort());
  });
});

describe("vacateTitle", () => {
  it("leaves the title empty and refuses to vacate twice", async () => {
    const division = await divisionIdBySlug(db, "peso-semipesado");
    const a = await fighter(division);
    await setChampion(db, "pro", division, a, "admin-1");

    const change = await vacateTitle(db, "pro", division, "admin-1");

    expect(change.affectedFighterIds).toEqual([a]);
    const [title] = await db.select().from(titles).where(eq(titles.divisionId, division));
    expect(title).toMatchObject({ championFighterId: null, since: null });
    await expect(vacateTitle(db, "pro", division, "admin-1")).rejects.toThrow("ya está vacante");
  });
});

describe("dismissSuggestion", () => {
  it("is idempotent and rejects an unknown event", async () => {
    const event = await insertEvent(db);
    const a = await fighter();
    const key = `pro:${ligero}`;
    await dismissSuggestion(db, event.id, a, key, "admin-1");
    await dismissSuggestion(db, event.id, a, key, "admin-1");
    expect(await db.select().from(dismissedSuggestions).where(eq(dismissedSuggestions.eventId, event.id))).toHaveLength(1);
    await expect(dismissSuggestion(db, "00000000-0000-4000-8000-000000000000", a, key, "admin-1")).rejects.toThrow("No se encontró el evento");
  });
});

describe("a fighter who stops being eligible while ranked", () => {
  it("disappears from the public ranking and shows up in the warnings", async () => {
    const division = await divisionIdBySlug(db, "peso-pluma");
    const [keep, leave] = [await fighter(division, { firstName: "Keep", lastName: "Stays" }), await fighter(division, { firstName: "Matías", lastName: "Pérez" })];
    await saveRanking(db, scope(division), [leave, keep], "admin-1");

    await updateFighter(db, leave, { firstName: "Matías", lastName: "Pérez", gender: "male", nationality: "CL", divisionId: division, careerStatus: "retired", proWins: 3 }, "admin-1");

    const page = await getPublicRankings(db, "pro");
    const card = page.cards.find((candidate) => candidate.division?.id === division);
    expect(card?.entries.map((entry) => entry.fighter.id)).toEqual([keep]);
    expect(await listIneligibleWarnings(db, scope(division))).toContain("Matías Pérez está retirado: quítalo del ranking");
    expect(await listIneligibleWarnings(db, scope(ligero))).not.toContain("Matías Pérez está retirado: quítalo del ranking");
  });

  it("is listed when the fighter is also the champion", async () => {
    const division = await divisionIdBySlug(db, "peso-pluma-femenino");
    const champ = await fighter(division, { gender: "female", firstName: "Campeona", lastName: "Caída" });
    await setChampion(db, "pro", division, champ, "admin-1");
    await updateFighter(db, champ, { firstName: "Campeona", lastName: "Caída", gender: "female", nationality: "CL", divisionId: division, careerStatus: "inactive", proWins: 3 }, "admin-1");

    expect(await listIneligibleWarnings(db, scope(division))).toContain("Campeona Caída está inactivo: deja vacante el título de Peso Pluma fem.");
  });
});

describe("deleteFighter and the rankings", () => {
  it("refuses a fighter in the current ranking and a champion, but not one only in old versions", async () => {
    const division = await divisionIdBySlug(db, "peso-gallo-femenino");
    const [ranked, champion, old] = [await fighter(division, { gender: "female" }), await fighter(division, { gender: "female" }), await fighter(division, { gender: "female" })];
    await setChampion(db, "pro", division, champion, "admin-1");
    await saveRanking(db, scope(division), [old, ranked], "admin-1");
    await saveRanking(db, scope(division), [ranked], "admin-1");

    await expect(deleteFighter(db, ranked, "admin-1")).rejects.toThrow("Está en el ranking: quítalo primero");
    await expect(deleteFighter(db, champion, "admin-1")).rejects.toThrow("Es campeón: deja vacante el título primero");
    expect(await getFighterRankingStanding(db, old)).toBeNull();
    await expect(deleteFighter(db, old, "admin-1")).resolves.toBeUndefined();
  });
});
