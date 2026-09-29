import DOMPurify from "isomorphic-dompurify";
import sharp from "sharp";
import { MEDIA_SPECS, clampCrop, variantWidthsFor, type Crop, type MediaKind, type Size } from "@/domain/media-specs";
import type { MediaEdit } from "./schema";

const WEBP_OPTIONS = { quality: 82, alphaQuality: 90 } as const;

/** Tamaño de la imagen tal como la ve la persona: con EXIF aplicado y ya girada. */
async function orientedSize(original: Buffer, rotation: MediaEdit["rotation"]): Promise<Size> {
  const { width = 0, height = 0, orientation = 1 } = await sharp(original).metadata();
  const exifSwapped = orientation >= 5;
  const [w, h] = exifSwapped ? [height, width] : [width, height];
  return rotation === 90 || rotation === 270 ? { w: h, h: w } : { w, h };
}

/** Sin recorte, se toma el mayor recorte con la proporción del tipo, centrado en el punto de enfoque. */
function defaultCrop(size: Size, aspect: number | null, focal: MediaEdit["focal"]): Crop {
  if (aspect === null) return { x: 0, y: 0, width: size.w, height: size.h };

  const width = Math.min(size.w, size.h * aspect);
  const height = width / aspect;
  return {
    x: Math.min(Math.max(0, focal.x * size.w - width / 2), size.w - width),
    y: Math.min(Math.max(0, focal.y * size.h - height / 2), size.h - height),
    width,
    height,
  };
}

export async function renderVariants(
  original: Buffer,
  kind: MediaKind,
  edit: MediaEdit,
): Promise<{ width: number; buffer: Buffer }[]> {
  const size = await orientedSize(original, edit.rotation);
  const crop = clampCrop(edit.crop ?? defaultCrop(size, MEDIA_SPECS[kind].aspect, edit.focal), size);
  const { brightness, contrast, saturation } = edit.adjustments;

  // Se aplica el recorte y los ajustes una sola vez y cada variante sale de ese resultado.
  let pipeline = sharp(original).autoOrient();
  if (edit.rotation !== 0) pipeline = pipeline.rotate(edit.rotation);
  pipeline = pipeline.extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height });
  if (brightness !== 1 || saturation !== 1) pipeline = pipeline.modulate({ brightness, saturation });
  if (contrast !== 1) pipeline = pipeline.linear(contrast, 128 * (1 - contrast));

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  return Promise.all(
    variantWidthsFor(kind, crop.width).map(async (width) => ({
      width,
      buffer: await sharp(data, { raw: info }).resize({ width, withoutEnlargement: true }).webp(WEBP_OPTIONS).toBuffer(),
    })),
  );
}

export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}
