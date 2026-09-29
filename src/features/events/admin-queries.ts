import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { events } from "@/db/schema/events";
import { getMediaByIds } from "@/features/media/queries";
import type { AdminEventRow } from "./dto";

const ADMIN_PAGE_SIZE = 50;

export type AdminEventFilters = { publication?: "draft" | "scheduled" | "published" };

/** Listado del panel: borradores y programados incluidos, la papelera no. Fecha más lejana primero. 50 por página. */
export async function listAdminEvents(
  db: Db,
  filters: AdminEventFilters,
  { page = 1, pageSize = ADMIN_PAGE_SIZE }: { page?: number; pageSize?: number } = {},
): Promise<{ items: AdminEventRow[]; hasMore: boolean }> {
  const conditions = [isNull(events.deletedAt)];
  if (filters.publication) conditions.push(eq(events.status, filters.publication));

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      name: events.name,
      number: events.number,
      startsAt: events.startsAt,
      venueCity: events.venueCity,
      eventStatus: events.eventStatus,
      status: events.status,
      publishAt: events.publishAt,
      updatedAt: events.updatedAt,
      posterMediaId: events.posterMediaId,
      // Un conteo por evento dentro de la misma consulta (usa el índice de `bouts.event_id`): sin N+1. Va con los
      // nombres escritos a mano: en una consulta de una sola tabla drizzle omite el prefijo de las columnas y la
      // subconsulta compararía `bouts.event_id` consigo misma.
      boutCount: sql<number>`(select count(*)::int from "bouts" where "bouts"."event_id" = "events"."id")`,
    })
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.startsAt), asc(events.id))
    .limit(pageSize + 1)
    .offset((Math.max(page, 1) - 1) * pageSize);

  const pageRows = rows.slice(0, pageSize);
  const posterIds = [...new Set(pageRows.flatMap((row) => (row.posterMediaId ? [row.posterMediaId] : [])))];
  const mediaById = await getMediaByIds(db, posterIds);
  return {
    items: pageRows.map(({ posterMediaId, ...row }) => ({ ...row, posterMedia: posterMediaId ? (mediaById.get(posterMediaId) ?? null) : null })),
    hasMore: rows.length > pageSize,
  };
}
