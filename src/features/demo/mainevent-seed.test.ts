import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { asc, count, eq, isNotNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { bouts, events } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import { rankingVersions, titles } from "@/db/schema/rankings";
import { LocalDriver } from "@/lib/storage/local";
import { createTestDb } from "@/test/db";
import { demoEventDates, seedMainevent } from "./mainevent-seed";

let db: Db;
let close: () => Promise<void>;
let rootDir: string;
const assetsDir = path.join(process.cwd(), "scripts/demo-assets");
const NOW = new Date("2026-11-05T15:00:00Z");

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  rootDir = await mkdtemp(path.join(tmpdir(), "mainevent-demo-"));
  await seedMainevent(db, { storage: new LocalDriver({ rootDir, secret: "test-secret" }), assetsDir, now: NOW });
}, 120_000);

afterAll(async () => {
  await close();
  await rm(rootDir, { recursive: true, force: true });
});

describe("demoEventDates", () => {
  it("keeps the poster date while it is ahead, and the past event five weeks earlier", () => {
    expect(demoEventDates(NOW)).toEqual({ upcoming: "2026-11-29", past: "2026-10-25" });
  });

  it("moves to a Sunday three weeks ahead once the poster date has passed", () => {
    expect(demoEventDates(new Date("2027-03-03T15:00:00Z"))).toEqual({ upcoming: "2027-03-28", past: "2027-02-21" });
  });
});

describe("seedMainevent", () => {
  it("creates one finished event with results and the upcoming one with its poster", async () => {
    const rows = await db.select({ name: events.name, eventStatus: events.eventStatus, poster: events.posterMediaId }).from(events).orderBy(asc(events.number));
    expect(rows.map(({ name, eventStatus }) => [name, eventStatus])).toEqual([
      ["Main XXVII", "completed"],
      ["Main XXVIII: Rebound", "scheduled"],
    ]);
    expect(rows[1]?.poster).not.toBeNull();
    const [{ finished }] = await db.select({ finished: count() }).from(bouts).where(eq(bouts.boutStatus, "completed"));
    expect(finished).toBe(6);
  });

  it("bills the main event like the poster", async () => {
    const [main] = await db.select({ posterTitle: bouts.posterTitle, level: bouts.level, rounds: bouts.scheduledRounds }).from(bouts).where(isNotNull(bouts.posterTitle)).orderBy(asc(bouts.sortOrder)).limit(1);
    expect(main).toEqual({ posterTitle: "WMO Continental Title Bout", level: "pro", rounds: 5 });
    const [cardenes] = await db.select({ body: fighters.bodyMediaId, headshot: fighters.headshotMediaId }).from(fighters).where(eq(fighters.slug, "cardenes"));
    expect(cardenes?.body).not.toBeNull();
    expect(cardenes?.headshot).not.toBeNull();
  });

  it("ranks both disciplines and is idempotent", async () => {
    const levels = await db.selectDistinct({ level: rankingVersions.level }).from(rankingVersions);
    expect(levels.map((row) => row.level).sort()).toEqual(["amateur", "pro"]);
    await seedMainevent(db, { storage: new LocalDriver({ rootDir, secret: "test-secret" }), assetsDir, now: NOW });
    const [[{ eventTotal }], [{ titleTotal }]] = await Promise.all([db.select({ eventTotal: count() }).from(events), db.select({ titleTotal: count() }).from(titles)]);
    expect([eventTotal, titleTotal]).toEqual([2, 6]);
  });
});
