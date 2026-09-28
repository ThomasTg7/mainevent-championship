import { desc } from "drizzle-orm";
import type { Db } from "@/db";
import { auditLog } from "@/db/schema/audit";

export type AuditLogRow = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: Date;
};

export async function listRecentAudit(db: Db, limit = 50): Promise<AuditLogRow[]> {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
