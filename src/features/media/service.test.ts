import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { media } from "@/db/schema/media";
import type { MediaKind } from "@/domain/media-specs";
import { LocalDriver } from "@/lib/storage/local";
import { createTestDb } from "@/test/db";
import { getMedia, getMediaByIds, getMediaEdit } from "./queries";
import type { MediaEdit } from "./schema";
import { createUpload, finalizeUpload, purgeOrphanMedia, saveMediaEdit } from "./service";

const NEUTRAL_EDIT: MediaEdit = {
  crop: null,
  rotation: 0,
  focal: { x: 0.5, y: 0.5 },
  adjustments: { brightness: 1, contrast: 1, saturation: 1, sharpness: 0 },
  alt: "Peleador",
};

const HOUR = 60 * 60 * 1000;
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100"/></svg>';
const DIRTY_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><script>alert(1)</script><rect width="200" height="100" onclick="x()"/></svg>';

describe("media service", () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;
  let db: Db;
  let rootDir: string;
  let storage: LocalDriver;

  beforeAll(async () => {
    testDb = await createTestDb();
    db = testDb.db;
  });

  afterAll(() => testDb.close());

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), "gc-media-"));
    storage = new LocalDriver({ rootDir, secret: "test-secret" });
    await db.delete(media);
  });

  afterEach(() => rm(rootDir, { recursive: true, force: true }));

  async function jpeg(width: number, height: number): Promise<Buffer> {
    return sharp({ create: { width, height, channels: 3, background: "#369" } }).jpeg().toBuffer();
  }

  /** Simula lo que hace el navegador: pide la URL, sube el archivo y luego llama finalize. */
  async function upload(kind: MediaKind, contentType: string, body: Buffer, declaredSize = body.length) {
    const { mediaId } = await createUpload(db, storage, { kind, contentType, size: declaredSize });
    const [row] = await db.select().from(media).where(eq(media.id, mediaId));
    await storage.put(row.originalKey, body, contentType);
    return mediaId;
  }

  async function readyMedia(kind: MediaKind, width: number, height: number): Promise<string> {
    const mediaId = await upload(kind, "image/jpeg", await jpeg(width, height));
    await finalizeUpload(db, storage, mediaId);
    return mediaId;
  }

  describe("createUpload", () => {
    it("rejects files over 15 MB", async () => {
      await expect(
        createUpload(db, storage, { kind: "gallery", contentType: "image/jpeg", size: 16 * 1024 * 1024 }),
      ).rejects.toThrow("El archivo supera 15 MB");
    });

    it("rejects unsupported formats", async () => {
      await expect(
        createUpload(db, storage, { kind: "gallery", contentType: "image/gif", size: 1000 }),
      ).rejects.toThrow("Formato no permitido");
    });

    it("only allows SVG for sponsor logos", async () => {
      await expect(
        createUpload(db, storage, { kind: "fighter_body", contentType: "image/svg+xml", size: 1000 }),
      ).rejects.toThrow("Formato no permitido");
      await expect(
        createUpload(db, storage, { kind: "sponsor_logo", contentType: "image/svg+xml", size: 1000 }),
      ).resolves.toBeDefined();
    });

    it("creates a pending row with the original key and a signed upload url", async () => {
      const result = await createUpload(db, storage, { kind: "fighter_body", contentType: "image/png", size: 1000 });

      const [row] = await db.select().from(media).where(eq(media.id, result.mediaId));
      expect(row.status).toBe("pending");
      expect(row.originalKey).toMatch(/^originals\/fighter_body\/[0-9a-f-]{36}\.png$/);
      expect(result.uploadUrl).toContain(`/api/media/upload/${row.originalKey}`);
      expect(result.headers).toEqual({ "Content-Type": "image/png" });
    });
  });

  describe("finalizeUpload", () => {
    it("reads the dimensions and warns when the image is below the minimum", async () => {
      const mediaId = await upload("fighter_body", "image/jpeg", await jpeg(700, 1050));

      const result = await finalizeUpload(db, storage, mediaId);

      expect(result).toEqual({
        width: 700,
        height: 1050,
        warning: "La imagen es más chica que el mínimo recomendado (800×1200) y puede verse pixelada.",
      });
    });

    it("reports the dimensions the person sees, with the EXIF orientation applied", async () => {
      const rotated = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#369" } })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer();
      const mediaId = await upload("gallery", "image/jpeg", rotated);

      const result = await finalizeUpload(db, storage, mediaId);

      expect([result.width, result.height]).toEqual([2000, 3000]);
    });

    it("rejects and discards a file that is not an image", async () => {
      const mediaId = await upload("gallery", "image/jpeg", Buffer.from("no soy una imagen"));

      await expect(finalizeUpload(db, storage, mediaId)).rejects.toThrow("El archivo no es una imagen válida");
      expect(await db.select().from(media).where(eq(media.id, mediaId))).toEqual([]);
    });

    it("accepts a PNG saved with a .jpg label and records the real type", async () => {
      const png = await sharp({ create: { width: 800, height: 1200, channels: 3, background: "#369" } }).png().toBuffer();
      const mediaId = await upload("fighter_body", "image/jpeg", png);

      await expect(finalizeUpload(db, storage, mediaId)).resolves.toMatchObject({ width: 800, height: 1200 });

      const [row] = await db.select().from(media).where(eq(media.id, mediaId));
      expect(row.mime).toBe("image/png");
    });

    it("rejects a raster image uploaded as SVG and the other way around", async () => {
      const png = await sharp({ create: { width: 300, height: 150, channels: 3, background: "#369" } }).png().toBuffer();
      const asSvg = await upload("sponsor_logo", "image/svg+xml", png);
      const asRaster = await upload("sponsor_logo", "image/png", Buffer.from(SVG));

      await expect(finalizeUpload(db, storage, asSvg)).rejects.toThrow("El archivo no es una imagen válida");
      await expect(finalizeUpload(db, storage, asRaster)).rejects.toThrow("El archivo no es una imagen válida");
    });

    it("rejects and discards an upload that exceeds 15 MB after the fact", async () => {
      // El cliente declara un tamaño pequeño y sube más: S3 no limita el PUT firmado.
      const mediaId = await upload("gallery", "image/jpeg", Buffer.alloc(15 * 1024 * 1024 + 1), 1000);

      await expect(finalizeUpload(db, storage, mediaId)).rejects.toThrow("El archivo supera 15 MB");
      expect(await db.select().from(media).where(eq(media.id, mediaId))).toEqual([]);
    });

    it("rewrites SVG logos sanitized", async () => {
      const mediaId = await upload("sponsor_logo", "image/svg+xml", Buffer.from(DIRTY_SVG));

      await finalizeUpload(db, storage, mediaId);

      const [row] = await db.select().from(media).where(eq(media.id, mediaId));
      const stored = await readFile(path.join(rootDir, row.originalKey), "utf8");
      expect(stored).not.toContain("<script");
      expect(stored).not.toContain("onclick");
    });

    it("fails for an unknown upload", async () => {
      await expect(finalizeUpload(db, storage, "00000000-0000-4000-8000-000000000000")).rejects.toThrow(
        "No se encontró la imagen",
      );
    });
  });

  describe("saveMediaEdit", () => {
    it("renders the variants and leaves the media ready", async () => {
      const mediaId = await readyMedia("fighter_body", 1200, 1800);

      const dto = await saveMediaEdit(db, storage, mediaId, NEUTRAL_EDIT);

      expect(dto.variants.map((variant) => variant.width)).toEqual([400, 800, 1200]);
      const [row] = await db.select().from(media).where(eq(media.id, mediaId));
      expect(row.status).toBe("ready");
      expect(row.alt).toBe("Peleador");
      for (const variant of row.variants) {
        expect((await sharp(await storage.get(variant.key)).metadata()).format).toBe("webp");
      }
    });

    it("stores the crop parameters and keeps the original", async () => {
      const mediaId = await readyMedia("fighter_body", 1200, 1800);
      const edit = { ...NEUTRAL_EDIT, crop: { x: 0, y: 0, width: 600, height: 900 }, focal: { x: 0.25, y: 0.1 } };

      await saveMediaEdit(db, storage, mediaId, edit);

      const [row] = await db.select().from(media).where(eq(media.id, mediaId));
      expect(row.crop).toEqual(edit.crop);
      expect([row.focalX, row.focalY]).toEqual([0.25, 0.1]);
      expect(row.variants.map((variant) => variant.width)).toEqual([400]);
      await expect(storage.get(row.originalKey)).resolves.toBeInstanceOf(Buffer);
    });

    it("deletes the previous variants when the image is edited again", async () => {
      const mediaId = await readyMedia("fighter_body", 1200, 1800);
      await saveMediaEdit(db, storage, mediaId, NEUTRAL_EDIT);
      const [before] = await db.select().from(media).where(eq(media.id, mediaId));

      await saveMediaEdit(db, storage, mediaId, { ...NEUTRAL_EDIT, rotation: 180 });

      const [after] = await db.select().from(media).where(eq(media.id, mediaId));
      const oldKeys = before.variants.map((variant) => variant.key);
      const newKeys = after.variants.map((variant) => variant.key);
      expect(newKeys.filter((key) => oldKeys.includes(key))).toEqual([]);
      for (const key of oldKeys) await expect(storage.get(key)).rejects.toThrow();
      for (const key of newKeys) await expect(storage.get(key)).resolves.toBeInstanceOf(Buffer);
    });

    it("keeps SVG logos as they are, without variants", async () => {
      const mediaId = await upload("sponsor_logo", "image/svg+xml", Buffer.from(SVG));
      await finalizeUpload(db, storage, mediaId);

      const dto = await saveMediaEdit(db, storage, mediaId, NEUTRAL_EDIT);

      expect(dto.variants).toEqual([]);
      expect(dto.originalUrl).toContain("/media/originals/sponsor_logo/");
    });

    it("refuses to edit an upload that was never finalized", async () => {
      const { mediaId } = await createUpload(db, storage, { kind: "gallery", contentType: "image/jpeg", size: 10 });

      await expect(saveMediaEdit(db, storage, mediaId, NEUTRAL_EDIT)).rejects.toThrow(
        "La imagen aún no terminó de subirse",
      );
    });
  });

  describe("queries", () => {
    it("hides pending uploads and returns public urls for ready ones", async () => {
      const mediaId = await upload("fighter_body", "image/jpeg", await jpeg(1200, 1800));
      expect(await getMedia(db, mediaId, storage)).toBeNull();

      await finalizeUpload(db, storage, mediaId);
      await saveMediaEdit(db, storage, mediaId, { ...NEUTRAL_EDIT, focal: { x: 0.5, y: 0.2 } });

      const dto = await getMedia(db, mediaId, storage);
      expect(dto).toMatchObject({
        id: mediaId,
        kind: "fighter_body",
        width: 1200,
        height: 1800,
        alt: "Peleador",
        focal: { x: 0.5, y: 0.2 },
      });
      expect(dto?.variants[0].url).toMatch(/^\/media\/variants\/.+\/400\.webp$/);
    });

    it("returns the saved edit parameters so the editor can reopen them", async () => {
      const mediaId = await readyMedia("fighter_body", 1200, 1800);
      const edit: MediaEdit = {
        crop: { x: 0, y: 0, width: 600, height: 900 },
        rotation: 90,
        focal: { x: 0.3, y: 0.4 },
        adjustments: { brightness: 1.1, contrast: 0.9, saturation: 1, sharpness: 0.5 },
        alt: "Peleador",
      };
      await saveMediaEdit(db, storage, mediaId, edit);

      expect(await getMediaEdit(db, mediaId)).toEqual(edit);
    });

    it("loads several media in a single query", async () => {
      const ids: string[] = [];
      for (let i = 0; i < 3; i++) {
        const id = await readyMedia("gallery", 1300, 900);
        await saveMediaEdit(db, storage, id, NEUTRAL_EDIT);
        ids.push(id);
      }

      const map = await getMediaByIds(db, ids, storage);

      expect([...map.keys()].sort()).toEqual([...ids].sort());
    });
  });

  describe("purgeOrphanMedia", () => {
    it("deletes only pending uploads older than 24 hours, with their files", async () => {
      const now = new Date("2026-10-01T12:00:00Z");
      const stale = await upload("gallery", "image/jpeg", await jpeg(50, 50));
      const fresh = await upload("gallery", "image/jpeg", await jpeg(50, 50));
      const readyOld = await readyMedia("gallery", 1300, 900);
      await saveMediaEdit(db, storage, readyOld, NEUTRAL_EDIT);
      await db.update(media).set({ createdAt: new Date(now.getTime() - 25 * HOUR) }).where(eq(media.id, stale));
      await db.update(media).set({ createdAt: new Date(now.getTime() - 23 * HOUR) }).where(eq(media.id, fresh));
      await db.update(media).set({ createdAt: new Date(now.getTime() - 48 * HOUR) }).where(eq(media.id, readyOld));
      const [staleRow] = await db.select().from(media).where(eq(media.id, stale));

      const purged = await purgeOrphanMedia(db, storage, now);

      expect(purged).toBe(1);
      const remaining = (await db.select({ id: media.id }).from(media)).map((row) => row.id);
      expect(remaining.sort()).toEqual([fresh, readyOld].sort());
      await expect(storage.get(staleRow.originalKey)).rejects.toThrow();
    });
  });
});
