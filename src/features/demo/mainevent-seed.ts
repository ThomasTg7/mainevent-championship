import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { bouts, cardSegments, events } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import { media } from "@/db/schema/media";
import { rankingLevels, rankingVersions, titles } from "@/db/schema/rankings";
import { DEFAULT_ROUND_SECONDS } from "@/domain/bout-enums";
import { validateBoutResult } from "@/domain/bout-result";
import type { MediaKind } from "@/domain/media-specs";
import { normalizeSearchText } from "@/domain/search";
import { slugify } from "@/domain/slug";
import { divisionSlug } from "@/features/divisions/slug";
import { DEFAULT_EDIT } from "@/features/media/schema";
import { createUpload, finalizeUpload, saveMediaEdit } from "@/features/media/service";
import { saveRanking, setChampion } from "@/features/rankings/service";
import { addDaysToDate, fromSantiagoInputs, toSantiagoInputs } from "@/lib/santiago-time";
import type { StorageDriver } from "@/lib/storage";
import { DEMO_DIVISIONS, DEMO_EVENTS, DEMO_FIGHTERS, DEMO_RANKINGS, type DemoBout, type DemoEvent } from "./mainevent-data";

const ACTOR = "seed";
/** Fecha del afiche de Main XXVIII: domingo 29 de noviembre de 2026. */
const POSTER_DATE = "2026-11-29";

export type DemoOptions = { storage: StorageDriver; assetsDir: string; now?: Date };

function instant(date: string, time: string): Date {
  const value = fromSantiagoInputs(date, time);
  if (!value) throw new Error(`Fecha inválida en el demo: ${date} ${time}`);
  return value;
}

/** El domingo en o después de `YYYY-MM-DD`. */
function sundayOnOrAfter(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDaysToDate(date, (7 - weekday) % 7);
}

/** La fecha del afiche mientras esté por delante; si ya pasó, un domingo tres semanas después de hoy (el demo nunca vence). */
export function demoEventDates(now: Date): { upcoming: string; past: string } {
  const today = toSantiagoInputs(now).date;
  const upcoming = POSTER_DATE > today ? POSTER_DATE : sundayOnOrAfter(addDaysToDate(today, 21));
  return { upcoming, past: addDaysToDate(upcoming, -35) };
}

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png" };

/** Sube una imagen del material entregado con el mismo flujo del panel (original → validación → variantes WebP). */
async function uploadImage(db: Db, options: DemoOptions, kind: MediaKind, file: string, alt: string): Promise<string> {
  const buffer = await readFile(path.join(options.assetsDir, file));
  const contentType = MIME[path.extname(file)] ?? "image/jpeg";
  const { mediaId } = await createUpload(db, options.storage, { kind, contentType, size: buffer.length });
  const [row] = await db.select({ originalKey: media.originalKey }).from(media).where(eq(media.id, mediaId));
  await options.storage.put(row!.originalKey, buffer, contentType);
  await finalizeUpload(db, options.storage, mediaId);
  await saveMediaEdit(db, options.storage, mediaId, { ...DEFAULT_EDIT, focal: { x: 0.5, y: 0.3 }, alt });
  return mediaId;
}

async function seedDivisions(db: Db): Promise<Map<string, { id: string; gender: "male" | "female"; limitKg: number }>> {
  const counters = { male: 0, female: 0 };
  await db
    .insert(divisions)
    .values(DEMO_DIVISIONS.map((division) => ({ ...division, slug: divisionSlug(division.name, division.gender), sortOrder: (counters[division.gender] += 1) })))
    .onConflictDoNothing({ target: divisions.slug });
  const rows = await db.select({ id: divisions.id, slug: divisions.slug, gender: divisions.gender, limitKg: divisions.limitKg }).from(divisions);
  return new Map(rows.map((row) => [row.slug, row]));
}

async function seedFighters(db: Db, options: DemoOptions, divisionBySlug: Awaited<ReturnType<typeof seedDivisions>>): Promise<Map<string, string>> {
  const existing = await db.select({ slug: fighters.slug }).from(fighters).where(inArray(fighters.slug, DEMO_FIGHTERS.map((fighter) => fighter.slug)));
  const known = new Set(existing.map((row) => row.slug));
  for (const fighter of DEMO_FIGHTERS.filter((candidate) => !known.has(candidate.slug))) {
    const division = divisionBySlug.get(fighter.division);
    if (!division) throw new Error(`Falta la división ${fighter.division}`);
    const fullName = `${fighter.firstName} ${fighter.lastName}`.trim();
    const photos = fighter.photos
      ? {
          bodyMediaId: await uploadImage(db, options, "fighter_body", fighter.photos.body, fullName),
          headshotMediaId: await uploadImage(db, options, "fighter_headshot", fighter.photos.headshot, fullName),
        }
      : {};
    const [mtWins, mtLosses, mtDraws] = fighter.muayThai ?? [0, 0, 0];
    const [kbWins, kbLosses, kbDraws] = fighter.kickboxing ?? [0, 0, 0];
    await db.insert(fighters).values({
      slug: fighter.slug,
      firstName: fighter.firstName,
      lastName: fighter.lastName,
      nickname: fighter.nickname,
      gender: division.gender,
      nationality: fighter.nationality,
      divisionId: division.id,
      birthDate: fighter.birthDate,
      weightKg: division.limitKg,
      hometown: fighter.hometown,
      gym: fighter.gym,
      heightCm: fighter.heightCm,
      stance: fighter.stance,
      bio: fighter.bio,
      baseDiscipline: fighter.kickboxing ? "Kickboxing" : "Muay Thai",
      proWins: mtWins,
      proLosses: mtLosses,
      proDraws: mtDraws,
      amWins: kbWins,
      amLosses: kbLosses,
      amDraws: kbDraws,
      searchText: normalizeSearchText(`${fullName} ${fighter.nickname ?? ""}`),
      status: "published",
      ...photos,
    });
  }
  const rows = await db.select({ id: fighters.id, slug: fighters.slug }).from(fighters).where(inArray(fighters.slug, DEMO_FIGHTERS.map((fighter) => fighter.slug)));
  return new Map(rows.map((row) => [row.slug, row.id]));
}

function lookup(map: Map<string, string | { id: string }>, key: string, what: string): string {
  const value = map.get(key);
  if (!value) throw new Error(`Falta ${what} «${key}» en el demo de Mainevent`);
  return typeof value === "string" ? value : value.id;
}

function boutValues(bout: DemoBout, ids: { eventId: string; segmentId: string; sortOrder: number }, fighterIds: Map<string, string>, divisionBySlug: Map<string, { id: string }>) {
  const rounds = bout.rounds ?? 3;
  const base = {
    ...ids,
    redFighterId: lookup(fighterIds, bout.red, "el peleador"),
    blueFighterId: lookup(fighterIds, bout.blue, "el peleador"),
    divisionId: bout.division ? lookup(divisionBySlug, bout.division, "la división") : null,
    catchweightKg: bout.catchweightKg ?? null,
    level: bout.level,
    scheduledRounds: rounds,
    roundSeconds: DEFAULT_ROUND_SECONDS,
    isTitleFight: Boolean(bout.title),
    championCorner: bout.title?.championCorner ?? ("red" as const),
    posterTitle: bout.posterTitle ?? null,
  };
  if (!bout.result) return base;
  // El demo usa el mismo validador que el panel: un resultado inválido rompe el seed en vez de guardarse.
  const validated = validateBoutResult({ ...bout.result, submissionTechniqueId: null }, { scheduledRounds: rounds, roundSeconds: DEFAULT_ROUND_SECONDS });
  if (!validated.ok) throw new Error(`Resultado inválido en el demo: ${JSON.stringify(validated.errors)}`);
  return { ...base, boutStatus: "completed" as const, ...validated.value };
}

async function seedEvent(db: Db, options: DemoOptions, event: DemoEvent, date: string, fighterIds: Map<string, string>, divisionBySlug: Map<string, { id: string }>): Promise<void> {
  const slug = slugify(event.name);
  const [existing] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
  if (existing) return;
  const posterMediaId = event.poster ? await uploadImage(db, options, "event_poster", event.poster, `Afiche de ${event.name}`) : null;
  const isPast = event.date === "past";
  const [created] = await db
    .insert(events)
    .values({
      slug,
      name: event.name,
      number: event.number,
      startsAt: instant(date, "21:00"),
      doorsAt: isPast ? null : instant(date, "19:30"),
      venueName: "Recinto por confirmar",
      venueAddress: "",
      venueCity: "",
      // El afiche ya trae sus textos: va como afiche, no de portada (la portada arma el careo con las fotos recortadas).
      posterMediaId,
      eventStatus: isPast ? "completed" : "scheduled",
      status: "published",
    })
    .returning({ id: events.id });
  for (const [segmentIndex, segment] of event.segments.entries()) {
    const [row] = await db.insert(cardSegments).values({ eventId: created!.id, name: segment.name, sortOrder: segmentIndex, startsAt: instant(date, segment.time) }).returning({ id: cardSegments.id });
    await db.insert(bouts).values(segment.bouts.map((bout, sortOrder) => boutValues(bout, { eventId: created!.id, segmentId: row!.id, sortOrder }, fighterIds, divisionBySlug)));
  }
}

async function seedRankings(db: Db, fighterIds: Map<string, string>, divisionBySlug: Map<string, { id: string }>): Promise<void> {
  await db.insert(rankingLevels).values([{ level: "pro", isPublic: true }, { level: "amateur", isPublic: true }]).onConflictDoNothing();
  const [existingTitle] = await db.select({ id: titles.id }).from(titles).limit(1);
  const [existingVersion] = await db.select({ id: rankingVersions.id }).from(rankingVersions).limit(1);
  if (existingTitle || existingVersion) return;
  for (const scope of DEMO_RANKINGS) {
    const divisionId = scope.division ? lookup(divisionBySlug, scope.division, "la división") : null;
    if (divisionId && scope.champion) await setChampion(db, scope.level, divisionId, lookup(fighterIds, scope.champion, "el peleador"), ACTOR);
    await saveRanking(db, { level: scope.level, divisionId }, scope.ranking.map((slug) => lookup(fighterIds, slug, "el peleador")), ACTOR);
  }
}

/**
 * Carga el demo de Mainevent Championship: divisiones de Muay Thai y Kickboxing, peleadores, «Main XXVII» con
 * resultados, «Main XXVIII: Rebound» con su afiche y los rankings de las dos disciplinas. Idempotente: lo que ya
 * existe (por slug) no se toca, y los rankings solo se cargan en una base sin títulos ni rankings.
 */
export async function seedMainevent(db: Db, options: DemoOptions): Promise<void> {
  const dates = demoEventDates(options.now ?? new Date());
  const divisionBySlug = await seedDivisions(db);
  const fighterIds = await seedFighters(db, options, divisionBySlug);
  for (const event of DEMO_EVENTS) await seedEvent(db, options, event, dates[event.date], fighterIds, divisionBySlug);
  await seedRankings(db, fighterIds, divisionBySlug);
}
