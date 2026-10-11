import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { bouts, events } from "@/db/schema/events";
import { postEvents, posts } from "@/db/schema/posts";
import { siteSettings } from "@/db/schema/settings";
import { seedPosts } from "@/features/posts/seed";
import { createTestDb } from "@/test/db";
import { seedEvents } from "./seed";

let db: Db;
let close: () => Promise<void>;
const apply = (filename = "ofl-content.sql") => db.transaction(async (tx) => {
  for (const step of readFileSync(`scripts/${filename}`, "utf8").split("-- statement-breakpoint")) await tx.execute(sql.raw(step));
});

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  await seedEvents(db);
  await seedPosts(db);
  await db.execute(sql`UPDATE events SET name = replace(name, 'OFL', 'Guerra Campal'), slug = replace(slug, 'ofl-', 'guerra-campal-')`);
  await db.execute(sql`UPDATE posts SET title = replace(title, 'OFL', 'Guerra Campal'), slug = replace(slug, 'ofl', 'guerra-campal'), body = replace(body::text, 'OFL', 'Guerra Campal')::jsonb`);
  await db.insert(siteSettings).values({ key: "about", value: { body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Somos Guerra Campal" }] }] } } });
});
afterEach(() => close());

describe("OFL content migration", () => {
  it("preserves records, cards and relationships, updates rich text and is idempotent", async () => {
    const oldEvents = await db.select().from(events).orderBy(events.number);
    const oldBouts = await db.select().from(bouts);
    const oldRelationships = await db.select().from(postEvents);
    await db.update(events).set({ ticketUrl: "https://ticketera.example/guerra-campal-5" }).where(eq(events.id, oldEvents[4]!.id));
    await apply();
    const rows = await db.select().from(events).orderBy(events.number);
    expect(rows.map(({ name, slug }) => ({ name, slug }))).toEqual([1, 2, 3, 4, 5].map(number => ({ name: `OFL ${number}`, slug: `ofl-${number}` })));
    expect(rows.map(row => row.id)).toEqual(oldEvents.map(row => row.id));
    expect(rows[4]!.ticketUrl).toBe("https://ticketera.example/guerra-campal-5");
    expect(await db.select().from(bouts)).toEqual(oldBouts);
    expect(await db.select().from(postEvents)).toEqual(oldRelationships);
    expect(JSON.stringify(await db.select({ title: posts.title, slug: posts.slug, body: posts.body }).from(posts))).not.toMatch(/guerra[ -]campal/i);
    expect(JSON.stringify(await db.select().from(siteSettings))).toContain("Somos OFL");
    const audit = await db.select().from(auditLog);
    expect(audit.length).toBeGreaterThan(5);
    await apply();
    expect(await db.select().from(auditLog)).toHaveLength(audit.length);
  });
  it("can restore the original content and rejects overwriting subsequent edits", async () => {
    const before = await db.select({ name: events.name, slug: events.slug }).from(events).orderBy(events.number);
    await apply();
    const [event] = await db.select().from(events);
    await db.update(events).set({ name: "Nuevo nombre editorial" }).where(eq(events.id, event!.id));
    await expect(apply("ofl-content-rollback.sql")).rejects.toThrow(/cambió después/);
    await db.update(events).set({ name: `OFL ${event!.number}` }).where(eq(events.id, event!.id));
    await apply("ofl-content-rollback.sql");
    expect(await db.select({ name: events.name, slug: events.slug }).from(events).orderBy(events.number)).toEqual(before);
  });
  it("rolls back all changes when an OFL slug already exists", async () => {
    const [existing] = await db.select().from(events);
    await db.insert(events).values({ name: "Evento independiente", slug: "ofl-1", startsAt: existing!.startsAt, venueName: "Recinto", venueAddress: "Dirección", venueCity: "Santiago" });
    await expect(apply()).rejects.toThrow();
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect((await db.select().from(events).where(eq(events.number, 1)))[0]!.name).toBe("Guerra Campal 1");
  });
});
