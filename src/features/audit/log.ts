import type { Db } from "@/db";
import { auditLog } from "@/db/schema/audit";

export type AuditAction = "create" | "update" | "delete" | "restore" | "publish" | "result" | "login";

export type AuditEntry = {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
  diff?: unknown;
};

export async function logAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    summary: entry.summary,
    diff: entry.diff ?? null,
  });
}
