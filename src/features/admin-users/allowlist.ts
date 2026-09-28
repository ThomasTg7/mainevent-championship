import { count, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { allowedEmails } from "@/db/schema/auth";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isEmailAllowed(db: Db, email: string): Promise<boolean> {
  const [row] = await db
    .select({ email: allowedEmails.email })
    .from(allowedEmails)
    .where(eq(allowedEmails.email, normalizeEmail(email)));

  return row !== undefined;
}

export async function addAllowedEmail(db: Db, email: string, actorId: string | null): Promise<void> {
  await db
    .insert(allowedEmails)
    .values({ email: normalizeEmail(email), addedBy: actorId })
    .onConflictDoNothing();
}

export async function removeAllowedEmail(db: Db, email: string, actorId: string | null): Promise<void> {
  void actorId;

  const [{ value: total }] = await db.select({ value: count() }).from(allowedEmails);

  if (total <= 1) {
    throw new Error("No se puede quitar el último administrador");
  }

  await db.delete(allowedEmails).where(eq(allowedEmails.email, normalizeEmail(email)));
}
