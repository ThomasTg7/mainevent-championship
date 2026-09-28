import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import type { Db } from "@/db";
import { registerTrashable } from "@/features/trash/trash";
import { handlePurge } from "./route";

const cronTestTable = pgTable("cron_purge_test", {
  id: text("id").primaryKey(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

describe("GET /api/cron/purge", () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;
  let db: Db;
  const originalSecret = process.env.CRON_SECRET;

  beforeAll(async () => {
    testDb = await createTestDb();
    db = testDb.db;
    await db.execute(sql`
      create temporary table cron_purge_test (
        id text primary key,
        deleted_at timestamptz
      )
    `);
    registerTrashable("cron_purge_test_entity", cronTestTable);
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterAll(async () => {
    process.env.CRON_SECRET = originalSecret;
    await testDb.close();
  });

  beforeEach(async () => {
    await db.execute(sql`delete from cron_purge_test`);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const request = new Request("http://localhost/api/cron/purge");

    const response = await handlePurge(request, db);

    expect(response.status).toBe(401);
  });

  it("returns 401 when the Authorization header has the wrong secret", async () => {
    const request = new Request("http://localhost/api/cron/purge", {
      headers: { authorization: "Bearer wrong-secret" },
    });

    const response = await handlePurge(request, db);

    expect(response.status).toBe(401);
  });

  it("returns 200 with the purged count when the secret matches", async () => {
    const expired = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await db.insert(cronTestTable).values({ id: "old", deletedAt: expired });

    const request = new Request("http://localhost/api/cron/purge", {
      headers: { authorization: "Bearer test-cron-secret" },
    });

    const response = await handlePurge(request, db);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ purged: 1 });
  });
});
