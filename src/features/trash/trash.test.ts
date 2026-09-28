import { eq, sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import type { Db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { listTrash, purgeExpired, registerTrashable, restore, softDelete } from "./trash";

const trashTestTable = pgTable("trash_test", {
  id: text("id").primaryKey(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

const ENTITY_TYPE = "trash_test_entity";
const day = 24 * 60 * 60 * 1000;

describe("trash", () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;
  let db: Db;

  beforeAll(async () => {
    testDb = await createTestDb();
    db = testDb.db;
    await db.execute(sql`
      create temporary table trash_test (
        id text primary key,
        deleted_at timestamptz
      )
    `);
    registerTrashable(ENTITY_TYPE, trashTestTable);
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await db.execute(sql`delete from trash_test`);
    await db.execute(sql`delete from audit_log`);
    await db.insert(trashTestTable).values([{ id: "a" }, { id: "b" }]);
  });

  it("softDelete sets deletedAt and logs a delete entry", async () => {
    await softDelete(db, ENTITY_TYPE, "a", "actor-1");

    const [row] = await db.select().from(trashTestTable).where(eq(trashTestTable.id, "a"));
    expect(row.deletedAt).not.toBeNull();

    const [logRow] = await db.select().from(auditLog).where(eq(auditLog.entityId, "a"));
    expect(logRow).toMatchObject({ action: "delete", entityType: ENTITY_TYPE, actorId: "actor-1" });
  });

  it("restore clears deletedAt and logs a restore entry", async () => {
    await softDelete(db, ENTITY_TYPE, "a", "actor-1");
    await restore(db, ENTITY_TYPE, "a", "actor-1");

    const [row] = await db.select().from(trashTestTable).where(eq(trashTestTable.id, "a"));
    expect(row.deletedAt).toBeNull();

    const restoreLogs = await db.select().from(auditLog).where(eq(auditLog.action, "restore"));
    expect(restoreLogs).toHaveLength(1);
    expect(restoreLogs[0]).toMatchObject({ entityId: "a", entityType: ENTITY_TYPE, actorId: "actor-1" });
  });

  it("listTrash returns soft-deleted rows across registered tables", async () => {
    await softDelete(db, ENTITY_TYPE, "a", "actor-1");

    const items = await listTrash(db);

    expect(items).toEqual([expect.objectContaining({ entityType: ENTITY_TYPE, id: "a" })]);
  });

  it("purgeExpired deletes only rows soft-deleted 30 days ago or more, and returns the count", async () => {
    const now = new Date();
    await db
      .update(trashTestTable)
      .set({ deletedAt: new Date(now.getTime() - 30 * day - 60_000) })
      .where(eq(trashTestTable.id, "a"));
    await db
      .update(trashTestTable)
      .set({ deletedAt: new Date(now.getTime() - 30 * day + 60_000) })
      .where(eq(trashTestTable.id, "b"));

    const purged = await purgeExpired(db, now);

    expect(purged).toBe(1);
    const remaining = await db.select({ id: trashTestTable.id }).from(trashTestTable);
    expect(remaining).toEqual([{ id: "b" }]);
  });
});
