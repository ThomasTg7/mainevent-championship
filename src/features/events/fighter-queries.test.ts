import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { computeRecord } from "@/domain/record";
import { createFighter, setFighterPublication } from "@/features/fighters/service";
import { divisionIdBySlug, validFighterInput } from "@/features/fighters/test-helpers";
import { createTestDb } from "@/test/db";
import { getFighterFightHistory, getFighterNextBout, listBoutsForRecord } from "./fighter-queries";
import { seedEvents } from "./seed";
import { daysFromNow, fighterIdBySlug, insertBout, insertEvent, insertSegment } from "./test-helpers";

let db: Db;
let close: () => Promise<void>;
let perezId: string;
let newcomerId: string;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seedEvents(db);
  perezId = await fighterIdBySlug(db, "matias-perez");
  const newcomer = await createFighter(db, validFighterInput(await divisionIdBySlug(db, "peso-ligero"), { firstName: "Nuevo", lastName: "Ingreso" }), "admin-1");
  await setFighterPublication(db, newcomer.id, { status: "published", publishAt: null }, "admin-1");
  newcomerId = newcomer.id;
  const soto = await fighterIdBySlug(db, "diego-soto");

  // Peleas con resultado que no deben contar: evento en borrador, en la papelera y programado a futuro.
  const finished = {
    boutStatus: "completed",
    outcome: "blue_win",
    method: "decision",
    decisionType: "unanimous",
    endRound: 3,
    endTimeSeconds: 300,
  } as const;
  const hiddenEvents = [
    await insertEvent(db, { slug: "oculto-borrador", status: "draft", startsAt: daysFromNow(-10) }),
    await insertEvent(db, { slug: "oculto-papelera", deletedAt: new Date(), startsAt: daysFromNow(-11) }),
    await insertEvent(db, { slug: "oculto-programado", status: "scheduled", publishAt: daysFromNow(3), startsAt: daysFromNow(-12) }),
  ];
  for (const event of hiddenEvents) {
    await insertBout(db, { eventId: event.id, segmentId: await insertSegment(db, event.id), redFighterId: perezId, blueFighterId: soto, ...finished });
  }
});
afterAll(() => close());

describe("listBoutsForRecord", () => {
  it("returns only finished fights of public events", async () => {
    const rows = await listBoutsForRecord(db, perezId);
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.date instanceof Date)).toBe(true);
    // Pérez pelea de rojo en dos y de azul en una (la que perdió): el récord la lee bien desde cualquier esquina.
    expect(rows.filter((row) => row.blueFighterId === perezId)).toHaveLength(1);
  });

  it("feeds computeRecord: two wins and a loss for Pérez, in the promotion", async () => {
    const record = computeRecord(await listBoutsForRecord(db, perezId), perezId, "pro");
    expect([record.wins, record.losses, record.draws]).toEqual([2, 1, 0]);
    expect(record.streak).toEqual({ type: "win", count: 1 });
  });

  it("keeps amateur and pro fights apart", async () => {
    const cortes = await fighterIdBySlug(db, "valentina-cortes");
    const rows = await listBoutsForRecord(db, cortes);
    expect(computeRecord(rows, cortes, "amateur").draws).toBe(1);
    expect(computeRecord(rows, cortes, "pro").draws).toBe(0);
  });

  it("is empty for a fighter without fights", async () => {
    expect(await listBoutsForRecord(db, newcomerId)).toEqual([]);
  });
});

describe("getFighterFightHistory", () => {
  it("lists the finished fights of public events, newest first", async () => {
    const history = await getFighterFightHistory(db, perezId);
    expect(history.map((row) => row.eventSlug)).toEqual(["guerra-campal-4", "guerra-campal-2", "guerra-campal-1"]);
    expect(history.map((row) => row.fighterResult)).toEqual(["win", "loss", "win"]);
  });

  it("describes each fight from the fighter's point of view", async () => {
    const [knockout, loss, decision] = await getFighterFightHistory(db, perezId);
    expect(knockout).toMatchObject({ opponent: { lastName: "Araya", isPublic: true }, methodText: "KO", endRound: 2, endTimeSeconds: 123, level: "pro" });
    expect(loss).toMatchObject({ opponent: { lastName: "Soto" }, methodText: "Decisión dividida" });
    expect(decision).toMatchObject({ methodText: "Decisión unánime", endRound: 3, endTimeSeconds: 300 });
  });

  it("carries the date as ISO text and the event name", async () => {
    const [latest] = await getFighterFightHistory(db, perezId);
    expect(latest!.eventName).toBe("Guerra Campal 4");
    expect(new Date(latest!.date).toISOString()).toBe(latest!.date);
    expect(JSON.parse(JSON.stringify(latest))).toEqual(latest);
  });

  it("shows draws and no contests with their own label", async () => {
    const cortes = await getFighterFightHistory(db, await fighterIdBySlug(db, "valentina-cortes"));
    expect(cortes.map((row) => row.fighterResult).sort()).toEqual(["draw", "loss", "no_contest"]);
  });

  it("is empty for a fighter without fights", async () => {
    expect(await getFighterFightHistory(db, newcomerId)).toEqual([]);
  });
});

describe("getFighterNextBout", () => {
  it("returns the next scheduled fight of a public event", async () => {
    const next = await getFighterNextBout(db, perezId);
    expect(next).toMatchObject({ isTitleFight: true, scheduledRounds: 5, opponent: { lastName: "Soto" }, event: { slug: "guerra-campal-5", name: "Guerra Campal 5" } });
    expect(new Date(next!.event.startsAt).toISOString()).toBe(next!.event.startsAt);
  });

  it("names the division, or the catch weight when there is one", async () => {
    expect((await getFighterNextBout(db, perezId))?.divisionName).toBe("Ligero");
    const catchweight = await getFighterNextBout(db, await fighterIdBySlug(db, "joaquin-nunez"));
    expect(catchweight).toMatchObject({ divisionName: null, catchweightKg: 73.5 });
  });

  it("is null when the fighter has nothing scheduled", async () => {
    expect(await getFighterNextBout(db, await fighterIdBySlug(db, "nicolas-ibarra"))).toBeNull();
    expect(await getFighterNextBout(db, newcomerId)).toBeNull();
  });
});
