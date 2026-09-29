import { randomUUID } from "node:crypto";
import { and, eq, inArray, lt } from "drizzle-orm";
import sharp, { type Metadata } from "sharp";
import type { Db } from "@/db";
import { media, type MediaRow, type StoredVariant } from "@/db/schema/media";
import { MAX_INPUT_PIXELS, MAX_UPLOAD_BYTES, MEDIA_SPECS, checkResolution, isMediaKind, type MediaKind } from "@/domain/media-specs";
import type { StorageDriver } from "@/lib/storage";
import { toMediaDTO, type MediaDTO } from "./dto";
import { renderVariants, sanitizeSvg, visibleSize } from "./process";
import type { MediaEdit } from "./schema";

const ORPHAN_AFTER_MS = 24 * 60 * 60 * 1000;
const ORPHAN_BATCH = 200;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const FORMAT_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** Error con un mensaje pensado para mostrarse tal cual a la persona. */
export class MediaError extends Error {}

export type UploadInput = { kind: MediaKind; contentType: string; size: number };

export async function createUpload(
  db: Db,
  storage: StorageDriver,
  input: UploadInput,
): Promise<{ mediaId: string; uploadUrl: string; headers: Record<string, string> }> {
  if (!isMediaKind(input.kind)) throw new MediaError("Tipo de imagen inválido");
  if (input.size > MAX_UPLOAD_BYTES) throw new MediaError("El archivo supera 15 MB");
  if (!MEDIA_SPECS[input.kind].accepts.includes(input.contentType)) throw new MediaError("Formato no permitido");

  const mediaId = randomUUID();
  const originalKey = `originals/${input.kind}/${mediaId}.${EXTENSIONS[input.contentType]}`;
  const { url, headers } = await storage.presignPut(originalKey, input.contentType, MAX_UPLOAD_BYTES);
  await db.insert(media).values({ id: mediaId, kind: input.kind, originalKey, mime: input.contentType });

  return { mediaId, uploadUrl: url, headers };
}

async function discardUpload(db: Db, storage: StorageDriver, row: MediaRow): Promise<void> {
  await storage.delete(row.originalKey).catch(() => undefined);
  await db.delete(media).where(eq(media.id, row.id));
}

async function findMedia(db: Db, id: string): Promise<MediaRow> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) throw new MediaError("No se encontró la imagen");
  return row;
}

export async function finalizeUpload(
  db: Db,
  storage: StorageDriver,
  mediaId: string,
): Promise<{ width: number; height: number; warning?: string }> {
  const row = await findMedia(db, mediaId);
  if (row.status !== "pending") throw new MediaError("La imagen ya estaba procesada");

  let original = await storage.get(row.originalKey).catch(() => null);
  if (!original) throw new MediaError("No se recibió el archivo");

  // La URL firmada de S3 no limita el tamaño: se verifica aquí con el archivo real.
  if (original.length > MAX_UPLOAD_BYTES) {
    await discardUpload(db, storage, row);
    throw new MediaError("El archivo supera 15 MB");
  }

  if (row.mime === "image/svg+xml") {
    original = Buffer.from(sanitizeSvg(original.toString("utf8")), "utf8");
  }

  let metadata: Metadata;
  try {
    // Solo lee la cabecera; el tope de píxeles se revisa abajo con un mensaje claro.
    metadata = await sharp(original, { limitInputPixels: false }).metadata();
  } catch {
    metadata = {} as Metadata;
  }
  const { w, h } = visibleSize(metadata);
  // Se confía en el contenido real, no en la etiqueta del archivo (un PNG guardado como .jpg es común).
  // Lo que no puede cambiar es ser SVG o no: el SVG se sanitiza y no lleva variantes.
  const actualMime = metadata.format ? FORMAT_MIME[metadata.format] : undefined;
  const isSvg = row.mime === "image/svg+xml";
  if (!actualMime || w === 0 || h === 0 || (actualMime === "image/svg+xml") !== isSvg || !MEDIA_SPECS[row.kind].accepts.includes(actualMime)) {
    await discardUpload(db, storage, row);
    throw new MediaError("El archivo no es una imagen válida");
  }
  if (!isSvg && w * h > MAX_INPUT_PIXELS) {
    await discardUpload(db, storage, row);
    throw new MediaError("La imagen tiene demasiados píxeles (máx. 50 megapíxeles). Achícala e inténtalo de nuevo.");
  }

  if (isSvg) {
    await storage.put(row.originalKey, original, row.mime);
  }
  await db.update(media).set({ width: w, height: h, mime: actualMime }).where(eq(media.id, row.id));

  const { warning } = checkResolution(row.kind, w, h);
  return { width: w, height: h, ...(warning ? { warning } : {}) };
}

export async function saveMediaEdit(
  db: Db,
  storage: StorageDriver,
  mediaId: string,
  edit: MediaEdit,
): Promise<MediaDTO> {
  const row = await findMedia(db, mediaId);
  if (row.width === null || row.height === null) throw new MediaError("La imagen aún no terminó de subirse");

  const isSvg = row.mime === "image/svg+xml";
  let variants: StoredVariant[] = [];

  if (!isSvg) {
    const rendered = await renderVariants(await storage.get(row.originalKey), row.kind, edit);
    // La versión va en la clave: las variantes nuevas nunca pisan a las anteriores y se cachean para siempre.
    const version = randomUUID().slice(0, 8);
    variants = await Promise.all(
      rendered.map(async ({ width, height, buffer }) => {
        const key = `variants/${row.id}/${version}/${width}.webp`;
        await storage.put(key, buffer, "image/webp");
        return { width, height, key };
      }),
    );
  }

  // Se bloquea la fila para leer las variantes que de verdad se reemplazan: si dos ediciones se guardan
  // a la vez, cada una borra las de la anterior y no quedan archivos sin dueño.
  const { saved, replaced } = await db.transaction(async (tx) => {
    const [current] = await tx.select({ variants: media.variants }).from(media).where(eq(media.id, row.id)).for("update");
    const [updated] = await tx
      .update(media)
      .set({
        crop: edit.crop,
        rotation: edit.rotation,
        focalX: edit.focal.x,
        focalY: edit.focal.y,
        adjustments: edit.adjustments,
        variants,
        alt: edit.alt,
        status: "ready",
      })
      .where(eq(media.id, row.id))
      .returning();
    return { saved: updated, replaced: current?.variants ?? [] };
  });

  await Promise.allSettled(replaced.map((variant) => storage.delete(variant.key)));
  return toMediaDTO(saved, storage);
}

/** Subidas que nunca se finalizaron (pestaña cerrada, error de red) con más de 24 h. */
export async function purgeOrphanMedia(db: Db, storage: StorageDriver, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - ORPHAN_AFTER_MS);
  const orphans = await db
    .select({ id: media.id, originalKey: media.originalKey })
    .from(media)
    .where(and(eq(media.status, "pending"), lt(media.createdAt, cutoff)))
    .limit(ORPHAN_BATCH);

  if (orphans.length === 0) return 0;

  await Promise.allSettled(orphans.map((orphan) => storage.delete(orphan.originalKey)));
  await db.delete(media).where(inArray(media.id, orphans.map((orphan) => orphan.id)));
  return orphans.length;
}
