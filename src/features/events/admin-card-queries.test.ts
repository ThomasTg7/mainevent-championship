import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb } from "@/test/db";
import { getAdminCard } from "./admin-card-queries";
import { cancelBout } from "./card-service";
import { seedEvents } from "./seed";
import { deleteEvent } from "./service";
import { eventIdBySlug } from "./test-helpers";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seedEvents(db);
});
afterAll(() => close());

describe("getAdminCard", () => {
  it("returns the blocks and the fights in card order, with both fighters and the division", async () => {
    const card = (await getAdminCard(db, await eventIdBySlug(db, "guerra-campal-5")))!;
    expect(card.event).toMatchObject({ name: "Guerra Campal 5", slug: "guerra-campal-5", eventStatus: "scheduled" });
    expect(card.segments.map((segment) => [segment.name, segment.bouts.length])).toEqual([["Cartelera estelar", 3], ["Preliminares", 2]]);
    expect(card.segments.map((segment) => segment.startsTime)).toEqual(["21:30", "20:00"]);

    const main = card.segments[0]!.bouts[0]!;
    expect(main).toMatchObject({ isTitleFight: true, scheduledRounds: 5, divisionName: "Ligero", status: "scheduled", result: null, resultLine: null });
    expect([main.red.lastName, main.blue.lastName]).toEqual(["Pérez", "Soto"]);
    expect(card.segments[1]!.bouts.some((bout) => bout.catchweightKg === 73.5 && bout.divisionId === null)).toBe(true);
  });

  it("carries the saved result and its line, ready to be corrected", async () => {
    const card = (await getAdminCard(db, await eventIdBySlug(db, "guerra-campal-4")))!;
    const main = card.segments[0]!.bouts[0]!;
    expect(main.status).toBe("completed");
    expect(main.result).toMatchObject({ outcome: "red_win", method: "ko_tko", koTkoType: "ko", endRound: 2, endTimeSeconds: 123, bonuses: ["ko_of_night"] });
    expect(main.resultLine).toBe("Soto vence a Araya · KO · R2 2:03");
  });

  it("keeps cancelled fights in the card", async () => {
    const id = await eventIdBySlug(db, "guerra-campal-5");
    const first = (await getAdminCard(db, id))!.segments[1]!.bouts[0]!;
    await cancelBout(db, first.id, "Lesión", "admin-1");
    const after = (await getAdminCard(db, id))!.segments[1]!.bouts[0]!;
    expect(after).toMatchObject({ status: "cancelled", cancelReason: "Lesión" });
  });

  it("is null for an event in the trash or one that does not exist", async () => {
    const id = await eventIdBySlug(db, "guerra-campal-1");
    await deleteEvent(db, id, "admin-1");
    expect(await getAdminCard(db, id)).toBeNull();
    expect(await getAdminCard(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});
