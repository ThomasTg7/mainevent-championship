import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb } from "@/test/db";
import { listAdminFighters, listPublicFighters } from "./queries";
import { seedFighters } from "./seed";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});
afterAll(() => close());

describe("seedFighters", () => {
  it("creates 12 published fighters in 4 divisions and is idempotent", async () => {
    await seedFighters(db);
    await seedFighters(db);
    const { items } = await listAdminFighters(db, {});
    expect(items).toHaveLength(12);
    expect(new Set(items.map((fighter) => fighter.divisionName)).size).toBe(4);
    expect(items.every((fighter) => fighter.status === "published")).toBe(true);
  });

  it("includes the fighters of the approved mockup with the weight of their division", async () => {
    const { items } = await listPublicFighters(db, { q: "el toro" });
    expect(items[0]).toMatchObject({ slug: "matias-perez", record: { wins: 12, losses: 2, draws: 0 }, division: { limitKg: 70.3 } });
    expect((await listPublicFighters(db, { q: "pitbull" })).items[0]?.nationality).toBe("BR");
  });
});
