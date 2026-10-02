import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { bouts } from "@/db/schema/events";
import { rankingEntries, rankingVersions } from "@/db/schema/rankings";
import { fighterIdBySlug, eventIdBySlug } from "@/features/events/test-helpers";
import { updateFighter } from "@/features/fighters/service";
import { createTestDb } from "@/test/db";
import { getBoutRankLabels, getFighterRankingTags, getPublicRankings } from "./queries";
import { seedRankings } from "./seed";
import { saveRanking, setChampion } from "./service";
import { divisionIdBySlug, insertRankableFighter } from "./test-helpers";

describe("rankings of the seed", () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    await seedRankings(db);
  });
  afterAll(() => close());

  it("shows P4P first, then each division with its champion and numbered fighters", async () => {
    const page = await getPublicRankings(db, "pro");
    expect(page.cards.map((card) => card.division?.slug ?? "p4p")).toEqual(["p4p", "peso-pluma", "peso-ligero", "peso-welter", "peso-paja-femenino"]);
    const ligero = page.cards.find((card) => card.division?.slug === "peso-ligero");
    expect(ligero?.champion?.name).toBe("Matías Pérez");
    expect(ligero?.entries.map((entry) => [entry.position, entry.fighter.name])).toEqual([
      [1, "Diego Soto"],
      [2, "Felipe Araya"],
    ]);
    expect(ligero?.updatedAt).toEqual(expect.any(String));
  });

  it("keeps the first version of every scope as all NEW", async () => {
    const page = await getPublicRankings(db, "pro");
    const ligero = page.cards.find((card) => card.division?.slug === "peso-ligero");
    expect(ligero?.entries.map((entry) => entry.movement)).toEqual([{ kind: "new" }, { kind: "new" }]);
  });

  it("keeps pro and amateur rankings apart", async () => {
    const amateur = await getPublicRankings(db, "amateur");
    expect(amateur.cards).toHaveLength(1);
    expect(amateur.cards[0]?.division?.slug).toBe("peso-paja-femenino");
    expect(amateur.cards[0]?.champion?.name).toBe("Valentina Cortés");
  });

  it("gives the three expected tags to a fighter who is amateur champion, ranked in the division and in P4P", async () => {
    const cortes = await fighterIdBySlug(db, "valentina-cortes");
    expect(await getFighterRankingTags(db, cortes)).toEqual([
      { label: "Campeón amateur · Peso Paja fem." },
      { label: "#1 Peso Paja fem." },
      { label: "#5 P4P" },
    ]);
  });

  it("tags a champion and a P4P leader", async () => {
    const perez = await fighterIdBySlug(db, "matias-perez");
    expect(await getFighterRankingTags(db, perez)).toEqual([{ label: "Campeón pro · Peso Ligero" }, { label: "#1 P4P" }]);
  });

  it("tags only the division for a ranked fighter and nothing for a retired one", async () => {
    expect(await getFighterRankingTags(db, await fighterIdBySlug(db, "joaquin-nunez"))).toEqual([{ label: "#2 Peso Wélter" }]);
    expect(await getFighterRankingTags(db, await fighterIdBySlug(db, "nicolas-ibarra"))).toEqual([]);
  });

  it("labels the fighters of a card as C or #n, and skips catchweight bouts", async () => {
    const eventId = await eventIdBySlug(db, "guerra-campal-5");
    const rows = await db.select({ id: bouts.id, red: bouts.redFighterId, blue: bouts.blueFighterId, catchweightKg: bouts.catchweightKg }).from(bouts).where(eq(bouts.eventId, eventId));
    const labels = await getBoutRankLabels(db, rows.map((row) => row.id));
    const perez = await fighterIdBySlug(db, "matias-perez");
    const soto = await fighterIdBySlug(db, "diego-soto");
    expect(labels.get(perez)).toBe("C");
    expect(labels.get(soto)).toBe("#1");
    const catchweight = rows.find((row) => row.catchweightKg !== null)!;
    expect(labels.has(catchweight.red)).toBe(false);
    expect(labels.has(catchweight.blue)).toBe(false);
  });

  it("returns no labels without bouts", async () => {
    expect((await getBoutRankLabels(db, [])).size).toBe(0);
  });
});

describe("movement and visibility", () => {
  let db: Db;
  let close: () => Promise<void>;
  let division: string;

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    division = await divisionIdBySlug(db, "peso-ligero");
  });
  afterAll(() => close());

  it("computes ▲▼ and NUEVO against the previous version", async () => {
    const [a, b, c] = [await insertRankableFighter(db, division), await insertRankableFighter(db, division), await insertRankableFighter(db, division)];
    await saveRanking(db, { level: "pro", divisionId: division }, [a, b], "admin-1");
    await saveRanking(db, { level: "pro", divisionId: division }, [b, a, c], "admin-1");

    const card = (await getPublicRankings(db, "pro")).cards.find((candidate) => candidate.division?.id === division);
    expect(card?.entries.map((entry) => [entry.fighter.id, entry.movement])).toEqual([
      [b, { kind: "up", by: 1 }],
      [a, { kind: "down", by: 1 }],
      [c, { kind: "new" }],
    ]);
  });

  it("never shows the champion in the numbered list, even if an old version has them", async () => {
    const [champ, other] = [await insertRankableFighter(db, division), await insertRankableFighter(db, division)];
    await saveRanking(db, { level: "pro", divisionId: division }, [other], "admin-1");
    // Una versión escrita a mano (como la de un sistema anterior) con el campeón dentro.
    await setChampion(db, "pro", division, champ, "admin-1");
    const [version] = await db.insert(rankingVersions).values({ level: "pro", divisionId: division, createdBy: "x" }).returning({ id: rankingVersions.id });
    await db.insert(rankingEntries).values([
      { versionId: version!.id, position: 1, fighterId: champ },
      { versionId: version!.id, position: 2, fighterId: other },
    ]);

    const card = (await getPublicRankings(db, "pro")).cards.find((candidate) => candidate.division?.id === division);
    expect(card?.champion?.id).toBe(champ);
    expect(card?.entries.map((entry) => entry.fighter.id)).toEqual([other]);
    expect(card?.entries[0]?.position).toBe(1);
  });

  it("shows a vacant title as no champion once the champion is no longer active", async () => {
    const solo = await divisionIdBySlug(db, "peso-medio");
    const champ = await insertRankableFighter(db, solo);
    await setChampion(db, "pro", solo, champ, "admin-1");
    await updateFighter(db, champ, { firstName: "A", lastName: "B", gender: "male", nationality: "CL", divisionId: solo, careerStatus: "retired", proWins: 3 }, "admin-1");

    const page = await getPublicRankings(db, "pro");
    expect(page.cards.find((card) => card.division?.id === solo)).toBeUndefined();
  });

  it("omits a division with neither champion nor ranking", async () => {
    const page = await getPublicRankings(db, "amateur");
    expect(page.cards).toEqual([]);
  });
});
