import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { bouts, submissionTechniques } from "@/db/schema/events";
import type { Executor } from "@/db/types";
import { logAudit } from "@/features/audit/log";
import { UserFacingError } from "@/lib/user-facing-error";
import { sortOrderCase } from "./ordering";

// Catálogo editable de técnicas de sumisión (spec §4.5): agregar, renombrar, ordenar y quitar las que nadie usó.

const NOT_FOUND = "No se encontró la técnica";

const techniqueInputSchema = z.object({
  id: z.uuid().nullish(),
  name: z.string({ error: "Escribe el nombre de la técnica" }).trim().min(1, "Escribe el nombre de la técnica").max(60, "El nombre es demasiado largo (máx. 60 caracteres)"),
});

export type TechniqueInput = z.input<typeof techniqueInputSchema>;

async function orderedIds(db: Executor): Promise<string[]> {
  const rows = await db.select({ id: submissionTechniques.id }).from(submissionTechniques).orderBy(asc(submissionTechniques.sortOrder), asc(submissionTechniques.name));
  return rows.map((row) => row.id);
}

async function writeOrder(db: Executor, ids: string[]): Promise<void> {
  if (ids.length > 0) {
    await db.update(submissionTechniques).set({ sortOrder: sortOrderCase(submissionTechniques.id, ids) }).where(inArray(submissionTechniques.id, ids));
  }
}

/** Crea una técnica al final o, con `id`, la renombra. El nombre no se repite (sin distinguir mayúsculas). */
export async function saveTechnique(db: Db, input: TechniqueInput, actorId: string): Promise<{ id: string }> {
  const parsed = techniqueInputSchema.safeParse(input);
  if (!parsed.success) throw new UserFacingError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { id, name } = parsed.data;

  const [taken] = await db
    .select({ id: submissionTechniques.id })
    .from(submissionTechniques)
    .where(id ? and(sql`lower(${submissionTechniques.name}) = lower(${name})`, ne(submissionTechniques.id, id)) : sql`lower(${submissionTechniques.name}) = lower(${name})`)
    .limit(1);
  if (taken) throw new UserFacingError("Ya existe una técnica con ese nombre");

  if (id) {
    const [updated] = await db.update(submissionTechniques).set({ name }).where(eq(submissionTechniques.id, id)).returning({ id: submissionTechniques.id });
    if (!updated) throw new UserFacingError(NOT_FOUND);
    await logAudit(db, { actorId, action: "update", entityType: "submission_technique", entityId: id, summary: `Renombró la técnica de sumisión «${name}»` });
    return { id };
  }

  const [{ total }] = await db.select({ total: count() }).from(submissionTechniques);
  const [created] = await db.insert(submissionTechniques).values({ name, sortOrder: total ?? 0 }).returning({ id: submissionTechniques.id });
  if (!created) throw new UserFacingError("No se pudo guardar la técnica");
  await logAudit(db, { actorId, action: "create", entityType: "submission_technique", entityId: created.id, summary: `Agregó la técnica de sumisión «${name}»` });
  return { id: created.id };
}

/** `ids` debe ser exactamente el catálogo, en el orden nuevo. */
export async function reorderTechniques(db: Db, ids: string[], actorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await orderedIds(tx);
    if (ids.length !== current.length || new Set(ids).size !== ids.length || ids.some((id) => !current.includes(id))) {
      throw new UserFacingError("La lista de técnicas cambió: recarga la página e inténtalo de nuevo");
    }
    await writeOrder(tx, ids);
    await logAudit(tx, { actorId, action: "update", entityType: "submission_technique", entityId: "order", summary: "Reordenó las técnicas de sumisión" });
  });
}

/** Solo se elimina una técnica que ninguna pelea usa. */
export async function deleteTechnique(db: Db, id: string, actorId: string): Promise<void> {
  const [technique] = await db.select({ name: submissionTechniques.name }).from(submissionTechniques).where(eq(submissionTechniques.id, id)).limit(1);
  if (!technique) throw new UserFacingError(NOT_FOUND);

  const [{ total }] = await db.select({ total: count() }).from(bouts).where(eq(bouts.submissionTechniqueId, id));
  if ((total ?? 0) > 0) throw new UserFacingError(`Se usó en ${total} ${total === 1 ? "pelea" : "peleas"}: no se puede eliminar`);

  await db.transaction(async (tx) => {
    await tx.delete(submissionTechniques).where(eq(submissionTechniques.id, id));
    await writeOrder(tx, await orderedIds(tx));
    await logAudit(tx, { actorId, action: "delete", entityType: "submission_technique", entityId: id, summary: `Eliminó la técnica de sumisión «${technique.name}»` });
  });
}
