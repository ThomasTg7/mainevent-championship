import { and, asc, count, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { bouts, cardSegments, events } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import type { Executor } from "@/db/types";
import { logAudit } from "@/features/audit/log";
import { fromSantiagoInputs, toSantiagoInputs } from "@/lib/santiago-time";
import { UserFacingError } from "@/lib/user-facing-error";
import { boutInputSchema, cancelReasonSchema, segmentInputSchema, type BoutData, type BoutRawInput, type SegmentRawInput } from "./card-schema";
import { sortOrderCase } from "./ordering";

// Bloques y peleas de la cartelera. Cada bloque y cada pelea guarda `sort_order` contiguo (0..n-1): toda operación
// que mueve o quita algo reescribe el orden de los bloques afectados en el mismo UPDATE.

const EVENT_NOT_FOUND = "No se encontró el evento";
const SEGMENT_NOT_FOUND = "No se encontró el bloque";
const BOUT_NOT_FOUND = "No se encontró la pelea";
const CLEAR_RESULT_FIRST = "Primero borra el resultado";

function firstMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}

const fighterName = (fighter: { firstName: string; lastName: string }) => `${fighter.firstName} ${fighter.lastName}`;

// ── Lecturas de apoyo ────────────────────────────────────────────────────────────────────────────

async function findEvent(db: Executor, eventId: string): Promise<{ id: string; name: string; startsAt: Date }> {
  const [row] = await db
    .select({ id: events.id, name: events.name, startsAt: events.startsAt })
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);
  if (!row) throw new UserFacingError(EVENT_NOT_FOUND);
  return row;
}

async function findSegment(db: Executor, segmentId: string): Promise<{ id: string; eventId: string; name: string; eventName: string }> {
  const [row] = await db
    .select({ id: cardSegments.id, eventId: cardSegments.eventId, name: cardSegments.name, eventName: events.name, eventDeletedAt: events.deletedAt })
    .from(cardSegments)
    .innerJoin(events, eq(events.id, cardSegments.eventId))
    .where(eq(cardSegments.id, segmentId))
    .limit(1);
  if (!row) throw new UserFacingError(SEGMENT_NOT_FOUND);
  if (row.eventDeletedAt) throw new UserFacingError(EVENT_NOT_FOUND);
  return row;
}

type BoutSummary = { id: string; eventId: string; segmentId: string; hasResult: boolean; label: string; eventName: string };

/** La pelea, si su evento no está en la papelera, con «Pérez vs Soto» para los mensajes de auditoría. */
async function findBout(db: Executor, boutId: string): Promise<BoutSummary> {
  const red = alias(fighters, "red_fighter");
  const blue = alias(fighters, "blue_fighter");
  const [row] = await db
    .select({
      id: bouts.id,
      eventId: bouts.eventId,
      segmentId: bouts.segmentId,
      boutStatus: bouts.boutStatus,
      outcome: bouts.outcome,
      redLastName: red.lastName,
      blueLastName: blue.lastName,
      eventName: events.name,
      eventDeletedAt: events.deletedAt,
    })
    .from(bouts)
    .innerJoin(events, eq(events.id, bouts.eventId))
    .innerJoin(red, eq(red.id, bouts.redFighterId))
    .innerJoin(blue, eq(blue.id, bouts.blueFighterId))
    .where(eq(bouts.id, boutId))
    .limit(1);
  if (!row) throw new UserFacingError(BOUT_NOT_FOUND);
  if (row.eventDeletedAt) throw new UserFacingError(EVENT_NOT_FOUND);
  return {
    id: row.id,
    eventId: row.eventId,
    segmentId: row.segmentId,
    hasResult: row.boutStatus === "completed" || row.outcome !== null,
    label: `${row.redLastName} vs ${row.blueLastName}`,
    eventName: row.eventName,
  };
}

async function orderedBoutIds(db: Executor, segmentId: string, except?: string): Promise<string[]> {
  const rows = await db
    .select({ id: bouts.id })
    .from(bouts)
    .where(except ? and(eq(bouts.segmentId, segmentId), ne(bouts.id, except)) : eq(bouts.segmentId, segmentId))
    .orderBy(asc(bouts.sortOrder), asc(bouts.id));
  return rows.map((row) => row.id);
}

async function orderedSegmentIds(db: Executor, eventId: string, except?: string): Promise<string[]> {
  const rows = await db
    .select({ id: cardSegments.id })
    .from(cardSegments)
    .where(except ? and(eq(cardSegments.eventId, eventId), ne(cardSegments.id, except)) : eq(cardSegments.eventId, eventId))
    .orderBy(asc(cardSegments.sortOrder), asc(cardSegments.id));
  return rows.map((row) => row.id);
}

async function writeSegmentOrder(db: Executor, ids: string[]): Promise<void> {
  if (ids.length > 0) await db.update(cardSegments).set({ sortOrder: sortOrderCase(cardSegments.id, ids) }).where(inArray(cardSegments.id, ids));
}

async function writeBoutOrder(db: Executor, segmentId: string, ids: string[]): Promise<void> {
  if (ids.length > 0) await db.update(bouts).set({ segmentId, sortOrder: sortOrderCase(bouts.id, ids) }).where(inArray(bouts.id, ids));
}

// ── Bloques ──────────────────────────────────────────────────────────────────────────────────────

/** Crea un bloque al final o, con `id`, lo renombra. La hora (HH:mm, Chile) es la del día del evento; vacía la quita. */
export async function saveSegment(db: Db, eventId: string, input: SegmentRawInput, actorId: string): Promise<{ id: string }> {
  const parsed = segmentInputSchema.safeParse(input);
  if (!parsed.success) throw new UserFacingError(firstMessage(parsed.error));
  const { id, name, startsTime } = parsed.data;

  const event = await findEvent(db, eventId);
  const startsAt = startsTime ? fromSantiagoInputs(toSantiagoInputs(event.startsAt).date, startsTime) : null;

  if (id) {
    const [updated] = await db
      .update(cardSegments)
      .set({ name, startsAt })
      .where(and(eq(cardSegments.id, id), eq(cardSegments.eventId, eventId)))
      .returning({ id: cardSegments.id });
    if (!updated) throw new UserFacingError(SEGMENT_NOT_FOUND);
    await logAudit(db, { actorId, action: "update", entityType: "card_segment", entityId: id, summary: `Editó el bloque «${name}» de ${event.name}` });
    return { id };
  }

  const [{ total }] = await db.select({ total: count() }).from(cardSegments).where(eq(cardSegments.eventId, eventId));
  const [created] = await db.insert(cardSegments).values({ eventId, name, sortOrder: total ?? 0, startsAt }).returning({ id: cardSegments.id });
  if (!created) throw new UserFacingError("No se pudo guardar el bloque");
  await logAudit(db, { actorId, action: "create", entityType: "card_segment", entityId: created.id, summary: `Agregó el bloque «${name}» a ${event.name}` });
  return { id: created.id };
}

/** Solo un bloque sin peleas se puede eliminar. */
export async function deleteSegment(db: Db, segmentId: string, actorId: string): Promise<void> {
  const segment = await findSegment(db, segmentId);
  const [{ total }] = await db.select({ total: count() }).from(bouts).where(eq(bouts.segmentId, segmentId));
  if ((total ?? 0) > 0) throw new UserFacingError("Primero mueve o elimina las peleas de este bloque");

  await db.transaction(async (tx) => {
    await tx.delete(cardSegments).where(eq(cardSegments.id, segmentId));
    await writeSegmentOrder(tx, await orderedSegmentIds(tx, segment.eventId));
    await logAudit(tx, { actorId, action: "delete", entityType: "card_segment", entityId: segmentId, summary: `Eliminó el bloque «${segment.name}» de ${segment.eventName}` });
  });
}

/** `ids` debe ser exactamente la lista de bloques del evento, en el orden nuevo. */
export async function reorderSegments(db: Db, eventId: string, ids: string[], actorId: string): Promise<void> {
  const event = await findEvent(db, eventId);
  await db.transaction(async (tx) => {
    const current = await orderedSegmentIds(tx, eventId);
    if (ids.length !== current.length || new Set(ids).size !== ids.length || ids.some((id) => !current.includes(id))) {
      throw new UserFacingError("La lista de bloques cambió: recarga la página e inténtalo de nuevo");
    }
    await writeSegmentOrder(tx, ids);
    await logAudit(tx, { actorId, action: "update", entityType: "event", entityId: eventId, summary: `Reordenó los bloques de ${event.name}` });
  });
}

// ── Peleas ───────────────────────────────────────────────────────────────────────────────────────

function parseBout(input: BoutRawInput): BoutData {
  const parsed = boutInputSchema.safeParse(input);
  if (!parsed.success) throw new UserFacingError(firstMessage(parsed.error));
  return parsed.data;
}

function boutColumns(data: BoutData) {
  return {
    redFighterId: data.redFighterId,
    blueFighterId: data.blueFighterId,
    divisionId: data.divisionId,
    catchweightKg: data.catchweightKg,
    level: data.level,
    scheduledRounds: data.scheduledRounds,
    roundSeconds: data.roundSeconds,
    isTitleFight: data.isTitleFight,
  };
}

/**
 * Reglas de una pelea: dos peleadores distintos, existentes y fuera de la papelera (un borrador sí puede pelear),
 * ninguno con otra pelea vigente en el mismo evento, y una división que exista. Devuelve los nombres para la auditoría.
 */
async function assertBoutSetup(db: Executor, eventId: string, data: BoutData, exceptBoutId?: string): Promise<string> {
  if (data.redFighterId === data.blueFighterId) throw new UserFacingError("Un peleador no puede estar en ambas esquinas");

  const ids = [data.redFighterId, data.blueFighterId];
  const rows = await db
    .select({ id: fighters.id, firstName: fighters.firstName, lastName: fighters.lastName, deletedAt: fighters.deletedAt })
    .from(fighters)
    .where(inArray(fighters.id, ids));
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const id of ids) {
    const fighter = byId.get(id);
    if (!fighter) throw new UserFacingError("No se encontró al peleador");
    if (fighter.deletedAt) throw new UserFacingError("Ese peleador está en la papelera");
  }

  // Una pelea cancelada libera a sus peleadores para otra pelea del mismo evento.
  const booked = await db
    .select({ red: bouts.redFighterId, blue: bouts.blueFighterId })
    .from(bouts)
    .where(
      and(
        eq(bouts.eventId, eventId),
        ne(bouts.boutStatus, "cancelled"),
        or(inArray(bouts.redFighterId, ids), inArray(bouts.blueFighterId, ids)),
        exceptBoutId ? ne(bouts.id, exceptBoutId) : undefined,
      ),
    );
  for (const id of ids) {
    if (booked.some((row) => row.red === id || row.blue === id)) {
      throw new UserFacingError(`${fighterName(byId.get(id)!)} ya tiene una pelea en este evento`);
    }
  }

  if (data.divisionId) {
    const [division] = await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.id, data.divisionId)).limit(1);
    if (!division) throw new UserFacingError("Esa división no existe");
  }
  return `${byId.get(data.redFighterId)!.lastName} vs ${byId.get(data.blueFighterId)!.lastName}`;
}

/** Agrega la pelea al final del bloque. */
export async function addBout(db: Db, segmentId: string, input: BoutRawInput, actorId: string): Promise<{ id: string }> {
  const data = parseBout(input);
  const segment = await findSegment(db, segmentId);
  const label = await assertBoutSetup(db, segment.eventId, data);

  return db.transaction(async (tx) => {
    const [{ total }] = await tx.select({ total: count() }).from(bouts).where(eq(bouts.segmentId, segmentId));
    const [created] = await tx
      .insert(bouts)
      .values({ ...boutColumns(data), eventId: segment.eventId, segmentId, sortOrder: total ?? 0 })
      .returning({ id: bouts.id });
    if (!created) throw new UserFacingError("No se pudo guardar la pelea");
    await logAudit(tx, { actorId, action: "create", entityType: "bout", entityId: created.id, summary: `Agregó la pelea ${label} a ${segment.eventName}` });
    return { id: created.id };
  });
}

export async function updateBout(db: Db, boutId: string, input: BoutRawInput, actorId: string): Promise<void> {
  const data = parseBout(input);
  const bout = await findBout(db, boutId);
  if (bout.hasResult) throw new UserFacingError("Esta pelea ya tiene resultado: bórralo antes de cambiar la cartelera");
  const label = await assertBoutSetup(db, bout.eventId, data, boutId);

  await db.update(bouts).set(boutColumns(data)).where(eq(bouts.id, boutId));
  await logAudit(db, { actorId, action: "update", entityType: "bout", entityId: boutId, summary: `Editó la pelea ${label} de ${bout.eventName}` });
}

/** Mueve la pelea a la posición `index` de un bloque del mismo evento (`index` mayor al final = al final). */
export async function moveBout(db: Db, boutId: string, target: { segmentId: string; index: number }, actorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const bout = await findBout(tx, boutId);
    const segment = await findSegment(tx, target.segmentId);
    if (segment.eventId !== bout.eventId) throw new UserFacingError(SEGMENT_NOT_FOUND);

    const targetIds = await orderedBoutIds(tx, target.segmentId, boutId);
    const wanted = Number.isFinite(target.index) ? Math.trunc(target.index) : targetIds.length;
    targetIds.splice(Math.min(Math.max(wanted, 0), targetIds.length), 0, boutId);
    await writeBoutOrder(tx, target.segmentId, targetIds);

    if (bout.segmentId !== target.segmentId) await writeBoutOrder(tx, bout.segmentId, await orderedBoutIds(tx, bout.segmentId));
    await logAudit(tx, {
      actorId,
      action: "update",
      entityType: "bout",
      entityId: boutId,
      summary: `Movió la pelea ${bout.label} al bloque «${segment.name}» de ${bout.eventName}`,
    });
  });
}

/** Cancela la pelea (queda en la cartelera con su motivo). Si ya tiene resultado, se borra primero. */
export async function cancelBout(db: Db, boutId: string, reason: string | null, actorId: string): Promise<void> {
  const parsedReason = cancelReasonSchema.safeParse(reason);
  if (!parsedReason.success) throw new UserFacingError(firstMessage(parsedReason.error));
  const bout = await findBout(db, boutId);
  if (bout.hasResult) throw new UserFacingError(CLEAR_RESULT_FIRST);

  await db.update(bouts).set({ boutStatus: "cancelled", cancelReason: parsedReason.data }).where(eq(bouts.id, boutId));
  await logAudit(db, { actorId, action: "update", entityType: "bout", entityId: boutId, summary: `Canceló la pelea ${bout.label} de ${bout.eventName}` });
}

/** Devuelve a la cartelera una pelea cancelada. */
export async function reinstateBout(db: Db, boutId: string, actorId: string): Promise<void> {
  const bout = await findBout(db, boutId);
  await db.update(bouts).set({ boutStatus: "scheduled", cancelReason: null }).where(and(eq(bouts.id, boutId), eq(bouts.boutStatus, "cancelled")));
  await logAudit(db, { actorId, action: "update", entityType: "bout", entityId: boutId, summary: `Repuso la pelea ${bout.label} de ${bout.eventName}` });
}

/** Elimina la pelea y deja contiguo el orden del bloque. Con resultado, se borra primero. */
export async function deleteBout(db: Db, boutId: string, actorId: string): Promise<void> {
  const bout = await findBout(db, boutId);
  if (bout.hasResult) throw new UserFacingError(CLEAR_RESULT_FIRST);

  await db.transaction(async (tx) => {
    await tx.delete(bouts).where(eq(bouts.id, boutId));
    await writeBoutOrder(tx, bout.segmentId, await orderedBoutIds(tx, bout.segmentId));
    await logAudit(tx, { actorId, action: "delete", entityType: "bout", entityId: boutId, summary: `Eliminó la pelea ${bout.label} de ${bout.eventName}` });
  });
}
