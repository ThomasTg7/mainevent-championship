import { inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { bouts, cardSegments, events, submissionTechniques, type TicketTier } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import type { BoutLevel, ScheduledRounds } from "@/domain/bout-enums";
import { validateBoutResult, type BoutResultInput } from "@/domain/bout-result";
import { slugify } from "@/domain/slug";
import { seedFighters } from "@/features/fighters/seed";
import { addDaysToDate, fromSantiagoInputs, toSantiagoInputs } from "@/lib/santiago-time";

/** Catálogo inicial de técnicas de sumisión (spec §4.5); la promotora lo edita desde el panel. */
const TECHNIQUES = [
  "Mataleón",
  "Guillotina",
  "Triángulo",
  "Palanca de brazo",
  "Kimura",
  "Americana",
  "D'Arce",
  "Anaconda",
  "Atadura de brazo con el cuello",
  "Estrangulación norte-sur",
  "Llave de talón",
  "Llave de tobillo",
  "Kneebar",
];

export async function seedSubmissionTechniques(db: Db): Promise<void> {
  await db
    .insert(submissionTechniques)
    .values(TECHNIQUES.map((name, index) => ({ name, sortOrder: index })))
    .onConflictDoNothing({ target: submissionTechniques.name });
}

const F = {
  perez: "matias-perez",
  soto: "diego-soto",
  araya: "felipe-araya",
  fuentes: "ignacio-fuentes",
  andrade: "bruno-andrade",
  nunez: "joaquin-nunez",
  rojas: "camila-rojas",
  cortes: "valentina-cortes",
  munoz: "javiera-munoz",
  lagos: "sebastian-lagos",
  olivares: "martin-olivares",
  ibarra: "nicolas-ibarra",
} as const;

type SeedResult = Omit<BoutResultInput, "submissionTechniqueId"> & { technique?: string };
type SeedBout = {
  red: string;
  blue: string;
  division?: string;
  catchweightKg?: number;
  level?: BoutLevel;
  rounds?: ScheduledRounds;
  title?: boolean;
  notes?: string;
  result?: SeedResult;
};
type SeedSegment = { name: string; time: string; bouts: SeedBout[] };
type SeedEvent = { number: number; weeksBefore: number; segments: SeedSegment[] };

const cards = (...scores: [number, number][]) => scores.map(([red, blue], index) => ({ judge: `Juez ${index + 1}`, red, blue }));

// Cuatro eventos pasados (todos los métodos de resultado) y el próximo, sin resultados. Cada peleador pelea una vez por evento.
const PAST_EVENTS: SeedEvent[] = [
  {
    number: 1,
    weeksBefore: 32,
    segments: [
      {
        name: "Cartelera estelar",
        time: "21:30",
        bouts: [
          { red: F.soto, blue: F.araya, division: "peso-ligero", result: { outcome: "red_win", method: "decision", decisionType: "unanimous", scorecards: cards([29, 28], [29, 28], [30, 27]), referee: "Ricardo Salas" } },
          { red: F.fuentes, blue: F.andrade, division: "peso-welter", result: { outcome: "red_win", method: "ko_tko", koTkoType: "tko_strikes", endRound: 2, endTimeSeconds: 110 } },
        ],
      },
      {
        name: "Preliminares",
        time: "20:00",
        bouts: [
          { red: F.rojas, blue: F.munoz, division: "peso-paja-femenino", result: { outcome: "red_win", method: "submission", technique: "Guillotina", submissionType: "tap", endRound: 1, endTimeSeconds: 190 } },
          { red: F.lagos, blue: F.olivares, division: "peso-pluma", result: { outcome: "blue_win", method: "decision", decisionType: "split" } },
        ],
      },
    ],
  },
  {
    number: 2,
    weeksBefore: 24,
    segments: [
      {
        name: "Cartelera estelar",
        time: "21:30",
        bouts: [
          { red: F.araya, blue: F.soto, division: "peso-ligero", result: { outcome: "red_win", method: "decision", decisionType: "split", scorecards: cards([29, 28], [28, 29], [29, 28]) } },
          { red: F.andrade, blue: F.nunez, division: "peso-welter", result: { outcome: "red_win", method: "submission", technique: "Kimura", submissionType: "tap", endRound: 2, endTimeSeconds: 161 } },
        ],
      },
      {
        name: "Preliminares",
        time: "20:00",
        bouts: [
          { red: F.cortes, blue: F.munoz, division: "peso-paja-femenino", level: "amateur", result: { outcome: "draw", method: "decision", decisionType: "majority" } },
          { red: F.olivares, blue: F.lagos, division: "peso-pluma", result: { outcome: "red_win", method: "ko_tko", koTkoType: "ko", endRound: 1, endTimeSeconds: 52 } },
        ],
      },
    ],
  },
  {
    number: 3,
    weeksBefore: 16,
    segments: [
      {
        name: "Cartelera estelar",
        time: "21:30",
        bouts: [
          { red: F.araya, blue: F.lagos, catchweightKg: 68, result: { outcome: "red_win", method: "submission", technique: "Triángulo", submissionType: "tap", endRound: 2, endTimeSeconds: 222 } },
          { red: F.fuentes, blue: F.nunez, division: "peso-welter", result: { outcome: "red_win", method: "decision", decisionType: "majority" } },
        ],
      },
      {
        name: "Preliminares",
        time: "20:00",
        bouts: [
          { red: F.rojas, blue: F.cortes, division: "peso-paja-femenino", result: { outcome: "no_contest", method: "no_contest", ncReason: "accidental_foul", ncNote: "Dedo en el ojo", endRound: 1, endTimeSeconds: 75 } },
          { red: F.olivares, blue: F.ibarra, division: "peso-pluma", notes: "Corte en el ojo de Ibarra.", result: { outcome: "red_win", method: "technical_decision", decisionType: "unanimous", endRound: 2, endTimeSeconds: 150 } },
        ],
      },
    ],
  },
  {
    number: 4,
    weeksBefore: 8,
    segments: [
      {
        name: "Cartelera estelar",
        time: "21:30",
        bouts: [
          { red: F.soto, blue: F.araya, division: "peso-ligero", rounds: 5, result: { outcome: "red_win", method: "ko_tko", koTkoType: "ko", endRound: 2, endTimeSeconds: 123, bonuses: ["ko_of_night"] } },
          { red: F.andrade, blue: F.fuentes, division: "peso-welter", result: { outcome: "red_win", method: "submission", technique: "Americana", submissionType: "tap", endRound: 1, endTimeSeconds: 252, bonuses: ["sub_of_night"] } },
        ],
      },
      {
        name: "Preliminares",
        time: "20:00",
        bouts: [
          { red: F.rojas, blue: F.cortes, division: "peso-paja-femenino", result: { outcome: "red_win", method: "decision", decisionType: "split", bonuses: ["fight_of_night"] } },
          { red: F.lagos, blue: F.ibarra, division: "peso-pluma", result: { outcome: "red_win", method: "disqualification", dqReason: "Golpe bajo reiterado", endRound: 2, endTimeSeconds: 58 } },
        ],
      },
    ],
  },
];

const UPCOMING_CARD: SeedSegment[] = [
  {
    name: "Cartelera estelar",
    time: "21:30",
    bouts: [
      { red: F.perez, blue: F.soto, division: "peso-ligero", title: true, rounds: 5 },
      { red: F.rojas, blue: F.cortes, division: "peso-paja-femenino" },
      { red: F.andrade, blue: F.fuentes, division: "peso-welter" },
    ],
  },
  {
    name: "Preliminares",
    time: "20:00",
    bouts: [
      { red: F.lagos, blue: F.olivares, division: "peso-pluma" },
      { red: F.araya, blue: F.nunez, catchweightKg: 73.5 },
    ],
  },
];

const UPCOMING_TIERS: TicketTier[] = [
  { name: "General", description: "Galería · Acceso 19:30", priceClp: 15000, soldOut: false },
  { name: "Preferencial", description: "Platea numerada", priceClp: 25000, soldOut: false },
  { name: "Ringside", description: "Primera fila · Meet & greet", priceClp: 45000, soldOut: false },
];

const VENUE = { venueName: "Arena Santiago", venueAddress: "Av. Ejemplo 1234", venueCity: "Santiago", lat: -33.4489, lng: -70.6693 };

/** El sábado en o después de la fecha `YYYY-MM-DD`. */
function saturdayOnOrAfter(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDaysToDate(date, (6 - weekday + 7) % 7);
}

function instant(date: string, time: string): Date {
  const value = fromSantiagoInputs(date, time);
  if (!value) throw new Error(`Fecha inválida en el seed: ${date} ${time}`);
  return value;
}

type Lookups = { fighterId: Map<string, string>; divisionId: Map<string, string>; techniqueId: Map<string, string> };

async function loadLookups(db: Db): Promise<Lookups> {
  const [fighterRows, divisionRows, techniqueRows] = await Promise.all([
    db.select({ id: fighters.id, slug: fighters.slug }).from(fighters).where(inArray(fighters.slug, Object.values(F))),
    db.select({ id: divisions.id, slug: divisions.slug }).from(divisions),
    db.select({ id: submissionTechniques.id, name: submissionTechniques.name }).from(submissionTechniques),
  ]);
  return {
    fighterId: new Map(fighterRows.map((row) => [row.slug, row.id])),
    divisionId: new Map(divisionRows.map((row) => [row.slug, row.id])),
    techniqueId: new Map(techniqueRows.map((row) => [row.name, row.id])),
  };
}

function lookup(map: Map<string, string>, key: string, what: string): string {
  const id = map.get(key);
  if (!id) throw new Error(`Falta ${what} «${key}» para el seed de eventos`);
  return id;
}

function boutValues(seed: SeedBout, ids: { eventId: string; segmentId: string; sortOrder: number }, lookups: Lookups): typeof bouts.$inferInsert {
  const rounds = seed.rounds ?? 3;
  const base = {
    ...ids,
    redFighterId: lookup(lookups.fighterId, seed.red, "el peleador"),
    blueFighterId: lookup(lookups.fighterId, seed.blue, "el peleador"),
    divisionId: seed.division ? lookup(lookups.divisionId, seed.division, "la división") : null,
    catchweightKg: seed.catchweightKg ?? null,
    level: seed.level ?? "pro",
    scheduledRounds: rounds,
    isTitleFight: seed.title ?? false,
  };
  if (!seed.result) return { ...base, notes: seed.notes ?? null };

  // El seed usa el mismo validador que el panel: un resultado inválido rompe el seed en vez de guardarse.
  const { technique, ...input } = seed.result;
  const validated = validateBoutResult(
    { ...input, submissionTechniqueId: technique ? lookup(lookups.techniqueId, technique, "la técnica") : null, notes: seed.notes },
    { scheduledRounds: rounds, roundSeconds: 300 },
  );
  if (!validated.ok) throw new Error(`Resultado inválido en el seed: ${JSON.stringify(validated.errors)}`);
  return { ...base, boutStatus: "completed", ...validated.value };
}

async function insertCard(db: Db, eventId: string, eventDate: string, segments: SeedSegment[], lookups: Lookups): Promise<void> {
  for (const [segmentIndex, segment] of segments.entries()) {
    const [created] = await db
      .insert(cardSegments)
      .values({ eventId, name: segment.name, sortOrder: segmentIndex, startsAt: instant(eventDate, segment.time) })
      .returning({ id: cardSegments.id });
    await db.insert(bouts).values(segment.bouts.map((bout, sortOrder) => boutValues(bout, { eventId, segmentId: created!.id, sortOrder }, lookups)));
  }
}

/**
 * Cinco eventos: GC 1–4 finalizados con resultados de todo tipo y GC 5 programado (sábado 21:00, 3 a 4 semanas
 * después de `now`, sin resultados). Las fechas son relativas a `now`: el demo nunca queda vencido. Idempotente.
 */
export async function seedEvents(db: Db, now: Date = new Date()): Promise<void> {
  await seedFighters(db);
  await seedSubmissionTechniques(db);
  const lookups = await loadLookups(db);

  const upcomingDate = saturdayOnOrAfter(addDaysToDate(toSantiagoInputs(now).date, 21));
  const definitions = [
    ...PAST_EVENTS.map((event) => ({ ...event, date: addDaysToDate(upcomingDate, -7 * event.weeksBefore), past: true })),
    { number: 5, weeksBefore: 0, segments: UPCOMING_CARD, date: upcomingDate, past: false },
  ];

  for (const definition of definitions) {
    const name = `Guerra Campal ${definition.number}`;
    const [created] = await db
      .insert(events)
      .values({
        slug: slugify(name),
        name,
        number: definition.number,
        startsAt: instant(definition.date, "21:00"),
        ...VENUE,
        ...(definition.past
          ? { eventStatus: "completed" as const }
          : {
              doorsAt: instant(definition.date, "19:30"),
              endsEstimatedAt: instant(addDaysToDate(definition.date, 1), "00:30"),
              ticketUrl: "https://www.example.com/entradas/guerra-campal-5",
              ticketProvider: "Ticketera de ejemplo",
              ticketTiers: UPCOMING_TIERS,
              ticketPoints: "Boletería del recinto (lunes a sábado, 11:00 a 19:00) y tienda oficial de Guerra Campal.",
            }),
        status: "published" as const,
      })
      .onConflictDoNothing({ target: events.slug })
      .returning({ id: events.id });

    // Un evento que ya existía conserva su cartelera tal como está.
    if (created) await insertCard(db, created.id, definition.date, definition.segments, lookups);
  }
}
