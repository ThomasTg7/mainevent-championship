import { and, asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import type { Executor } from "@/db/types";
import { bouts, cardSegments } from "@/db/schema/events";

/**
 * Orden en que se pelea una noche: los bloques de atrás hacia adelante (preliminares primero, cartelera estelar al
 * final) y, dentro de cada bloque, de la última pelea a la primera (la estelar, que es la primera de la lista, cierra la noche).
 */
export const nightOrderBy = [desc(cardSegments.sortOrder), desc(bouts.sortOrder), asc(bouts.id)] as const;

/** La siguiente pelea sin resultado del evento según el orden de la noche (las canceladas no cuentan). */
export async function getNextPendingBoutId(db: Executor | Db, eventId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: bouts.id })
    .from(bouts)
    .innerJoin(cardSegments, eq(cardSegments.id, bouts.segmentId))
    .where(and(eq(bouts.eventId, eventId), eq(bouts.boutStatus, "scheduled")))
    .orderBy(...nightOrderBy)
    .limit(1);
  return row?.id ?? null;
}
