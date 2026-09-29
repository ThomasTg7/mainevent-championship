export const MEDIA_KINDS = [
  "fighter_body",
  "fighter_headshot",
  "event_hero",
  "event_hero_mobile",
  "event_poster",
  "news_cover",
  "gallery",
  "sponsor_logo",
  "og_image",
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export type Size = { w: number; h: number };
export type Crop = { x: number; y: number; width: number; height: number };

export type MediaSpec = {
  /** Ancho / alto del recorte; `null` = libre. */
  aspect: number | null;
  recommended: Size;
  min: Size;
  variantWidths: number[];
  accepts: string[];
  label: string;
};

const RASTER = ["image/jpeg", "image/png", "image/webp"];

export const MEDIA_SPECS: Record<MediaKind, MediaSpec> = {
  fighter_body: { aspect: 2 / 3, recommended: { w: 1200, h: 1800 }, min: { w: 800, h: 1200 }, variantWidths: [400, 800, 1200], accepts: RASTER, label: "Foto de cuerpo completo" },
  fighter_headshot: { aspect: 1, recommended: { w: 800, h: 800 }, min: { w: 400, h: 400 }, variantWidths: [200, 400, 800], accepts: RASTER, label: "Foto de rostro" },
  event_hero: { aspect: 16 / 9, recommended: { w: 1920, h: 1080 }, min: { w: 1280, h: 720 }, variantWidths: [800, 1280, 1920], accepts: RASTER, label: "Portada del evento" },
  event_hero_mobile: { aspect: 4 / 5, recommended: { w: 1080, h: 1350 }, min: { w: 720, h: 900 }, variantWidths: [540, 1080], accepts: RASTER, label: "Portada del evento (móvil)" },
  event_poster: { aspect: 4 / 5, recommended: { w: 1080, h: 1350 }, min: { w: 720, h: 900 }, variantWidths: [540, 1080], accepts: RASTER, label: "Afiche del evento" },
  news_cover: { aspect: 16 / 9, recommended: { w: 1600, h: 900 }, min: { w: 1200, h: 675 }, variantWidths: [400, 800, 1600], accepts: RASTER, label: "Portada de la noticia" },
  gallery: { aspect: null, recommended: { w: 2400, h: 2400 }, min: { w: 1200, h: 1200 }, variantWidths: [800, 1600, 2400], accepts: RASTER, label: "Foto de galería" },
  sponsor_logo: { aspect: 2, recommended: { w: 600, h: 300 }, min: { w: 300, h: 150 }, variantWidths: [300, 600], accepts: [...RASTER, "image/svg+xml"], label: "Logo del patrocinador" },
  og_image: { aspect: 1200 / 630, recommended: { w: 1200, h: 630 }, min: { w: 1200, h: 630 }, variantWidths: [1200], accepts: RASTER, label: "Imagen para compartir" },
};

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

export function checkResolution(kind: MediaKind, w: number, h: number): { ok: boolean; warning?: string } {
  const spec = MEDIA_SPECS[kind];

  if (spec.aspect === null) {
    if (Math.max(w, h) >= spec.min.w) return { ok: true };
    return {
      ok: false,
      warning: `La imagen es más chica que el mínimo recomendado (${spec.min.w} px de lado largo) y puede verse pixelada.`,
    };
  }

  if (w >= spec.min.w && h >= spec.min.h) return { ok: true };
  return {
    ok: false,
    warning: `La imagen es más chica que el mínimo recomendado (${spec.min.w}×${spec.min.h}) y puede verse pixelada.`,
  };
}

/** Nunca se escala hacia arriba; si el recorte es menor que todas las variantes, se usa su ancho. */
export function variantWidthsFor(kind: MediaKind, croppedWidth: number): number[] {
  const widths = MEDIA_SPECS[kind].variantWidths.filter((width) => width <= croppedWidth);
  return widths.length > 0 ? widths : [Math.max(1, Math.floor(croppedWidth))];
}

/** Ajusta un recorte a los límites de la imagen (el redondeo del editor puede pasarse por 1 px). */
export function clampCrop(crop: Crop, img: Size): Crop {
  const x = Math.min(Math.max(0, Math.round(crop.x)), img.w - 1);
  const y = Math.min(Math.max(0, Math.round(crop.y)), img.h - 1);
  const width = Math.max(1, Math.min(Math.round(crop.width), img.w - x));
  const height = Math.max(1, Math.min(Math.round(crop.height), img.h - y));
  return { x, y, width, height };
}
