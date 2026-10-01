import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { bouts, events, submissionTechniques } from "@/db/schema/events";
import { createTestDb } from "@/test/db";
import { seedEvents, seedSubmissionTechniques } from "./seed";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seedEvents(db);
});
afterAll(() => close());

describe("seedEvents", () => {
  it("creates four finished events and one upcoming, all published", async () => {
    const rows = await db.select({ number: events.number, eventStatus: events.eventStatus, status: events.status }).from(events).orderBy(events.number);
    expect(rows.map((row) => row.eventStatus)).toEqual(["completed", "completed", "completed", "completed", "scheduled"]);
    expect(rows.every((row) => row.status === "published")).toBe(true);
  });

  it("is idempotent", async () => {
    await seedEvents(db);
    const [{ total: eventTotal }] = await db.select({ total: count() }).from(events);
    const [{ total: boutTotal }] = await db.select({ total: count() }).from(bouts);
    expect([eventTotal, boutTotal]).toEqual([5, 21]);
  });

  it("covers every way a fight can end, all as valid results", async () => {
    const finished = await db.select({ outcome: bouts.outcome, method: bouts.method }).from(bouts).where(eq(bouts.boutStatus, "completed"));
    expect(new Set(finished.map((row) => row.method))).toEqual(
      new Set(["ko_tko", "submission", "decision", "technical_decision", "disqualification", "no_contest"]),
    );
    expect(new Set(finished.map((row) => row.outcome))).toEqual(new Set(["red_win", "blue_win", "draw", "no_contest"]));
    expect(finished).toHaveLength(16);
  });

  it("leaves the upcoming card without results", async () => {
    const [upcoming] = await db.select({ id: events.id }).from(events).where(eq(events.slug, "guerra-campal-5"));
    const rows = await db.select({ boutStatus: bouts.boutStatus, outcome: bouts.outcome }).from(bouts).where(eq(bouts.eventId, upcoming!.id));
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.boutStatus === "scheduled" && row.outcome === null)).toBe(true);
  });
});

describe("seedSubmissionTechniques", () => {
  it("loads the 13 initial techniques once, in order", async () => {
    await seedSubmissionTechniques(db);
    const rows = await db.select({ name: submissionTechniques.name }).from(submissionTechniques).orderBy(submissionTechniques.sortOrder);
    expect(rows).toHaveLength(13);
    expect(rows[0]!.name).toBe("Mataleón");
    expect(rows.at(-1)!.name).toBe("Kneebar");
  });
});
