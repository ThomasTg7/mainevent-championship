import { and, eq, isNotNull, lte } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Db } from "@/db";
import { logAudit } from "@/features/audit/log";

type TrashableTable = PgTable & {
  id: AnyPgColumn;
  deletedAt: AnyPgColumn;
};

export type TrashItem = {
  entityType: string;
  id: string;
  deletedAt: Date;
};

const registry = new Map<string, TrashableTable>();

export function registerTrashable(entityType: string, table: TrashableTable): void {
  registry.set(entityType, table);
}

function getTable(entityType: string): TrashableTable {
  const table = registry.get(entityType);

  if (!table) {
    throw new Error(`No hay una tabla registrada como papelera para "${entityType}"`);
  }

  return table;
}

export async function softDelete(db: Db, entityType: string, id: string, actorId: string): Promise<void> {
  const table = getTable(entityType);

  await db.update(table).set({ deletedAt: new Date() }).where(eq(table.id, id));
  await logAudit(db, {
    actorId,
    action: "delete",
    entityType,
    entityId: id,
    summary: `Se envió a la papelera ${entityType} ${id}`,
  });
}

export async function restore(db: Db, entityType: string, id: string, actorId: string): Promise<void> {
  const table = getTable(entityType);

  await db.update(table).set({ deletedAt: null }).where(eq(table.id, id));
  await logAudit(db, {
    actorId,
    action: "restore",
    entityType,
    entityId: id,
    summary: `Se restauró ${entityType} ${id}`,
  });
}

export async function listTrash(db: Db): Promise<TrashItem[]> {
  const items: TrashItem[] = [];

  for (const [entityType, table] of registry.entries()) {
    const rows = await db
      .select({ id: table.id, deletedAt: table.deletedAt })
      .from(table)
      .where(isNotNull(table.deletedAt));

    for (const row of rows) {
      items.push({ entityType, id: String(row.id), deletedAt: row.deletedAt as Date });
    }
  }

  return items;
}

export async function purgeExpired(db: Db, now: Date, days = 30): Promise<number> {
  const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  let purged = 0;

  for (const table of registry.values()) {
    const deleted = await db
      .delete(table)
      .where(and(isNotNull(table.deletedAt), lte(table.deletedAt, threshold)))
      .returning({ id: table.id });

    purged += deleted.length;
  }

  return purged;
}
