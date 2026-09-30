import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { seedEvents } from "./seed";
import { getNextEvent, getPublicEventBySlug, getPublicEventRef, listPublicEvents } from "./queries";
import { createTestDb } from "@/test/db";
import { daysFromNow, fighterIdBySlug, insertBout, insertEvent, insertSegment } from "./test-helpers";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seedEvents(db);

  const perez = await fighterIdBySlug(db, "matias-perez");
  const soto = await fighterIdBySlug(db, "diego-soto");
  const versus = { redFighterId: perez, blueFighterId: soto } as const;

  const draft = await insertEvent(db, { name: "Evento borrador", slug: "evento-borrador", status: "draft" });
  await insertBout(db, { eventId: draft.id, segmentId: await insertSegment(db, draft.id), ...versus });

  const trashed = await insertEvent(db, { name: "Evento en la papelera", slug: "evento-papelera", deletedAt: new Date() });
  await insertSegment(db, trashed.id);

  await insertEvent(db, { name: "Evento programado", slug: "evento-programado", status: "scheduled", publishAt: daysFromNow(10) });
  await insertEvent(db, { name: "Evento cercano", slug: "evento-cercano", startsAt: daysFromNow(5) });
  await insertEvent(db, { name: "Evento lejano", slug: "evento-lejano", startsAt: daysFromNow(90) });
  await insertEvent(db, { name: "Evento en vivo", slug: "evento-en-vivo", startsAt: daysFromNow(-0.1), eventStatus: "live" });
  await insertEvent(db, { name: "Evento olvidado", slug: "evento-olvidado", startsAt: daysFromNow(-3) });
  await insertEvent(db, { name: "Evento recién terminado", slug: "evento-terminado", startsAt: daysFromNow(-0.05), eventStatus: "completed" });
});
afterAll(() => close());

const names = (items: { name: string }[]) => items.map((event) => event.name);

describe("getPublicEventBySlug", () => {
  it("returns the segments in order, with the main event first", async () => {
    const event = await getPublicEventBySlug(db, "guerra-campal-5");
    expect(event).not.toBeNull();
    expect(event!.segments.map((segment) => segment.name)).toEqual(["Cartelera estelar", "Preliminares"]);

    const main = event!.segments[0]!.bouts[0]!;
    expect(main.red.lastName).toBe("Pérez");
    expect(main.blue.lastName).toBe("Soto");
    expect(main.isTitleFight).toBe(true);
    expect(main.scheduledRounds).toBe(5);
    expect(main.division?.name).toBe("Ligero");
    expect(main.result).toBeNull();
  });

  it("carries the event data as plain values that survive JSON caching", async () => {
    const event = (await getPublicEventBySlug(db, "guerra-campal-5"))!;
    expect(event.name).toBe("Guerra Campal 5");
    expect(event.number).toBe(5);
    expect(event.eventStatus).toBe("scheduled");
    expect(event.venue).toMatchObject({ name: "Arena Santiago", city: "Santiago" });
    expect(typeof event.startsAt).toBe("string");
    expect(new Date(event.startsAt).toISOString()).toBe(event.startsAt);
    expect(event.ticketTiers.map((tier) => tier.priceClp)).toEqual([15000, 25000, 45000]);
    expect(JSON.parse(JSON.stringify(event))).toEqual(event);
  });

  it("shows a catch weight instead of a division when the fight has one", async () => {
    const event = (await getPublicEventBySlug(db, "guerra-campal-5"))!;
    const catchweight = event.segments[1]!.bouts.find((bout) => bout.catchweightKg !== null);
    expect(catchweight).toMatchObject({ catchweightKg: 73.5, division: null });
  });

  it("marks fighters that are not public so the page does not link them", async () => {
    const event = (await getPublicEventBySlug(db, "guerra-campal-5"))!;
    expect(event.segments[0]!.bouts[0]!.red.isPublic).toBe(true);

    const draftEvent = (await getPublicEventBySlug(db, "evento-borrador", { preview: true }))!;
    expect(draftEvent.segments[0]!.bouts).toHaveLength(1);
  });

  it("writes the result line of a finished fight with the surnames", async () => {
    const event = (await getPublicEventBySlug(db, "guerra-campal-4"))!;
    const main = event.segments[0]!.bouts[0]!;
    expect(main.status).toBe("completed");
    expect(main.result).toMatchObject({ outcome: "red_win", method: "ko_tko", endRound: 2, endTimeSeconds: 123 });
    expect(main.result!.line).toBe("Soto vence a Araya · KO · R2 2:03");
  });

  it("names the submission technique in the result line", async () => {
    const event = (await getPublicEventBySlug(db, "guerra-campal-3"))!;
    const submission = event.segments[0]!.bouts[0]!;
    expect(submission.result!.line).toBe("Araya vence a Lagos · Sumisión (Triángulo) · R2 3:42");
    expect(submission).toMatchObject({ catchweightKg: 68, division: null });
    expect(submission.result!.techniqueName).toBe("Triángulo");
  });

  it("gives body photos only for the main event", async () => {
    const event = (await getPublicEventBySlug(db, "guerra-campal-5"))!;
    expect(event.segments[0]!.bouts[1]!.red.bodyMedia).toBeNull();
  });

  it("hides drafts, trashed and future-scheduled events; preview shows drafts but never the trash", async () => {
    expect(await getPublicEventBySlug(db, "evento-borrador")).toBeNull();
    expect(await getPublicEventBySlug(db, "evento-borrador", { preview: true })).not.toBeNull();
    expect(await getPublicEventBySlug(db, "evento-papelera")).toBeNull();
    expect(await getPublicEventBySlug(db, "evento-papelera", { preview: true })).toBeNull();
    expect(await getPublicEventBySlug(db, "evento-programado")).toBeNull();
    expect(await getPublicEventBySlug(db, "no-existe")).toBeNull();
  });
});

describe("getPublicEventRef", () => {
  it("answers only for events that are public right now", async () => {
    expect(await getPublicEventRef(db, "guerra-campal-5")).toMatchObject({ id: expect.any(String), eventStatus: "scheduled" });
    expect(await getPublicEventRef(db, "evento-en-vivo")).toMatchObject({ eventStatus: "live" });
    expect(await getPublicEventRef(db, "evento-borrador")).toBeNull();
    expect(await getPublicEventRef(db, "evento-papelera")).toBeNull();
    expect(await getPublicEventRef(db, "evento-programado")).toBeNull();
  });
});

describe("listPublicEvents", () => {
  it("lists upcoming events by date ascending, including one that is live now", async () => {
    const { items } = await listPublicEvents(db, { when: "upcoming" });
    expect(names(items)).toEqual(["Evento en vivo", "Evento cercano", "Guerra Campal 5", "Evento lejano"]);
  });

  it("lists past events by date descending, with the forgotten and the finished ones", async () => {
    const { items } = await listPublicEvents(db, { when: "past" });
    expect(names(items)).toEqual([
      "Evento recién terminado",
      "Evento olvidado",
      "Guerra Campal 4",
      "Guerra Campal 3",
      "Guerra Campal 2",
      "Guerra Campal 1",
    ]);
  });

  it("never lists drafts, trashed or not-yet-published events", async () => {
    const all = [...(await listPublicEvents(db, { when: "upcoming" })).items, ...(await listPublicEvents(db, { when: "past" })).items];
    expect(names(all)).not.toContain("Evento borrador");
    expect(names(all)).not.toContain("Evento en la papelera");
    expect(names(all)).not.toContain("Evento programado");
  });

  it("paginates and says whether there is another page", async () => {
    const first = await listPublicEvents(db, { when: "past" }, { page: 1, pageSize: 4 });
    const second = await listPublicEvents(db, { when: "past" }, { page: 2, pageSize: 4 });
    expect(first.items).toHaveLength(4);
    expect(first.hasMore).toBe(true);
    expect(names(second.items)).toEqual(["Guerra Campal 2", "Guerra Campal 1"]);
    expect(second.hasMore).toBe(false);
  });

  it("gives each card the main event, the tickets and the date as text", async () => {
    const { items } = await listPublicEvents(db, { when: "upcoming" });
    const card = items.find((event) => event.slug === "guerra-campal-5")!;
    expect(card.mainBout?.red.lastName).toBe("Pérez");
    expect(card.mainBout?.blue.lastName).toBe("Soto");
    expect(card.ticketTiers).toHaveLength(3);
    expect(card.ticketUrl).toMatch(/^https:/);
    expect(new Date(card.startsAt).toISOString()).toBe(card.startsAt);
    expect(items.find((event) => event.slug === "evento-cercano")!.mainBout).toBeNull();
  });
});

describe("getNextEvent", () => {
  it("returns the closest upcoming public event", async () => {
    expect((await getNextEvent(db))?.name).toBe("Evento en vivo");
  });
});
