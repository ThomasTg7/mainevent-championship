import { timingSafeEqual } from "node:crypto";
import type { Db } from "@/db";
import { logAudit } from "@/features/audit/log";

type PurgeDependencies = {
  db: Db;
  purgeExpired: (db: Db, now: Date) => Promise<number>;
  /** Tareas de limpieza de otros dominios (subidas de imágenes abandonadas). */
  purgeOrphanMedia?: (db: Db, now: Date) => Promise<number>;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return Boolean(secret) && received.length === expected.length && timingSafeEqual(received, expected);
}

export async function handlePurge(
  request: Request,
  { db, purgeExpired, purgeOrphanMedia }: PurgeDependencies,
): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const purged = await purgeExpired(db, new Date());

  if (purged > 0) {
    await logAudit(db, {
      actorId: "system",
      action: "delete",
      entityType: "trash",
      entityId: "purge",
      summary: `Se eliminaron definitivamente ${purged} elementos con más de 30 días en la papelera`,
    });
  }

  if (!purgeOrphanMedia) {
    return Response.json({ purged });
  }

  const orphanMedia = await purgeOrphanMedia(db, new Date());
  if (orphanMedia > 0) {
    await logAudit(db, {
      actorId: "system",
      action: "delete",
      entityType: "media",
      entityId: "purge",
      summary: `Se eliminaron ${orphanMedia} subidas de imágenes que nunca se terminaron`,
    });
  }

  return Response.json({ purged, orphanMedia });
}
