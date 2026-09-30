import { formatClock } from "@/domain/clock";
import { divisionTitle } from "@/features/fighters/labels";

// Textos y enlaces de la página pública del evento, sin React: se testean solos.

/** «Peso Ligero», «Peso Paja fem.» o «Peso pactado 72.5 kg» (el peso pactado manda sobre la división). Vacío si no hay ninguno. */
export function boutMeasure(bout: { catchweightKg: number | null; division: { name: string; gender: "male" | "female" } | null }): string {
  if (bout.catchweightKg !== null) return `Peso pactado ${bout.catchweightKg.toFixed(1)} kg`;
  return bout.division ? divisionTitle(bout.division) : "";
}

/** «5 × 5 MIN». Un round que no dura minutos exactos conserva los segundos: «3 × 1:30 MIN». */
export function roundsLabel(bout: { scheduledRounds: number; roundSeconds: number }): string {
  const length = bout.roundSeconds % 60 === 0 ? String(bout.roundSeconds / 60) : formatClock(bout.roundSeconds);
  return `${bout.scheduledRounds} × ${length} MIN`;
}

/** Lo que falta hasta la hora del evento; `null` cuando ya llegó. */
export function countdownParts(remainingMs: number): { days: number; hours: number; minutes: number; seconds: number } | null {
  if (remainingMs <= 0) return null;
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

/** El enlace de YouTube (watch, live o youtu.be) como URL de inserción sin cookies; `null` para cualquier otro enlace. */
export function youtubeEmbedUrl(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(url.hostname)) return null;

  const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.pathname.startsWith("/live/") ? url.pathname.slice("/live/".length) : url.pathname === "/watch" ? url.searchParams.get("v") : null;
  return id && YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

const MAP_MARGIN_DEGREES = 0.01;

/** Mapa de OpenStreetMap centrado en el recinto (sin clave de API). */
export function mapEmbedUrl(lat: number, lng: number): string {
  const box = [lng - MAP_MARGIN_DEGREES, lat - MAP_MARGIN_DEGREES, lng + MAP_MARGIN_DEGREES, lat + MAP_MARGIN_DEGREES].map((value) => value.toFixed(4)).join(",");
  const query = new URLSearchParams({ bbox: box, layer: "mapnik", marker: `${lat},${lng}` });
  return `https://www.openstreetmap.org/export/embed.html?${query.toString()}`;
}

/** Enlace para abrir el recinto en el mapa completo. */
export function mapLinkUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

/** Si la página muestra la cuenta regresiva: un evento programado que aún no empieza, o uno en vivo (dirá «EN VIVO»). */
export function showsCountdown(event: { eventStatus: "scheduled" | "live" | "completed" | "cancelled"; startsAt: string }, nowMs: number = Date.now()): boolean {
  if (event.eventStatus === "live") return true;
  return event.eventStatus === "scheduled" && new Date(event.startsAt).getTime() > nowMs;
}
