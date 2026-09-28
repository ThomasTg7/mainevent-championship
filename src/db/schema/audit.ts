import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "restore",
  "publish",
  "result",
  "login",
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").notNull(),
  action: auditAction("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summary: text("summary").notNull(),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
