import { and, eq, isNull, ne } from "drizzle-orm";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { fighters, type FighterSocials } from "@/db/schema/fighters";
import { normalizeSearchText } from "@/domain/search";
import { slugify, uniqueSlug } from "@/domain/slug";
import { logAudit } from "@/features/audit/log";
import { assertUsableMedia } from "@/features/media/service";
import { normalizePublishAt, publicationInputSchema, type PublicationInput } from "@/features/publication/schema";
import { softDelete } from "@/features/trash/trash";
import { UserFacingError } from "@/lib/user-facing-error";
import { fighterInputSchema, type FighterData, type FighterRawInput } from "./schema";

const NOT_FOUND = "No se encontró al peleador";

function parseFighter(input: FighterRawInput): FighterData {
  const parsed = fighterInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  return parsed.data;
}

function fullName(data: { firstName: string; lastName: string }): string {
  return `${data.firstName} ${data.lastName}`;
}

/** Columnas editables (sin slug ni publicación, que se resuelven aparte). */
function editableColumns(data: FighterData) {
  const socials: FighterSocials = {};
  for (const network of ["instagram", "tiktok", "youtube", "x"] as const) {
    const handle = data[network];
    if (handle) socials[network] = handle;
  }

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    nickname: data.nickname,
    gender: data.gender,
    birthDate: data.birthDate,
    nationality: data.nationality,
    hometown: data.hometown,
    divisionId: data.divisionId,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    reachCm: data.reachCm,
    stance: data.stance,
    gym: data.gym,
    coach: data.coach,
    baseDiscipline: data.baseDiscipline,
    bio: data.bio,
    careerStatus: data.careerStatus,
    socials,
    bodyMediaId: data.bodyMediaId,
    headshotMediaId: data.headshotMediaId,
    proWins: data.proWins,
    proLosses: data.proLosses,
    proDraws: data.proDraws,
    proNoContests: data.proNoContests,
    amWins: data.amWins,
    amLosses: data.amLosses,
    amDraws: data.amDraws,
    amNoContests: data.amNoContests,
    searchText: normalizeSearchText([data.firstName, data.lastName, data.nickname].filter(Boolean).join(" ")),
  };
}

/** La división debe existir, coincidir con el género y estar activa (salvo que el peleador ya la tuviera). */
async function assertDivisionFits(db: Db, data: FighterData, currentDivisionId?: string): Promise<void> {
  const [division] = await db
    .select({ gender: divisions.gender, active: divisions.active })
    .from(divisions)
    .where(eq(divisions.id, data.divisionId))
    .limit(1);
  if (!division) throw new UserFacingError("Selecciona una división");
  if (division.gender !== data.gender) throw new UserFacingError("La división no corresponde al género del peleador");
  if (!division.active && data.divisionId !== currentDivisionId) {
    throw new UserFacingError("Esa división está inactiva. Actívala en Divisiones o elige otra.");
  }
}

async function slugTaken(db: Db, slug: string, exceptId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: fighters.id })
    .from(fighters)
    .where(exceptId ? and(eq(fighters.slug, slug), ne(fighters.id, exceptId)) : eq(fighters.slug, slug))
    .limit(1);
  return row !== undefined;
}

export async function createFighter(db: Db, input: FighterRawInput, actorId: string): Promise<{ id: string; slug: string }> {
  const data = parseFighter(input);
  await assertDivisionFits(db, data);
  await assertUsableMedia(db, [
    { id: data.bodyMediaId, kind: "fighter_body" },
    { id: data.headshotMediaId, kind: "fighter_headshot" },
  ]);

  let slug: string;
  if (data.slug) {
    if (await slugTaken(db, data.slug)) throw new UserFacingError("Ese enlace ya lo usa otro peleador");
    slug = data.slug;
  } else {
    slug = await uniqueSlug(slugify(fullName(data)) || "peleador", (candidate) => slugTaken(db, candidate));
  }

  const status = data.status ?? "draft";
  const [created] = await db
    .insert(fighters)
    .values({ ...editableColumns(data), slug, status, publishAt: normalizePublishAt({ status, publishAt: data.publishAt }) })
    .returning({ id: fighters.id });
  if (!created) throw new UserFacingError("No se pudo guardar al peleador");

  await logAudit(db, {
    actorId,
    action: "create",
    entityType: "fighter",
    entityId: created.id,
    summary: `Creó al peleador ${fullName(data)}`,
  });
  return { id: created.id, slug };
}

/**
 * Edita al peleador. El slug publicado no cambia al renombrarlo: solo si `input.slug` trae uno distinto.
 * La publicación solo cambia si `input.status` viene informado.
 */
export async function updateFighter(db: Db, id: string, input: FighterRawInput, actorId: string): Promise<{ slug: string }> {
  const data = parseFighter(input);
  const [current] = await db
    .select({ slug: fighters.slug, divisionId: fighters.divisionId })
    .from(fighters)
    .where(and(eq(fighters.id, id), isNull(fighters.deletedAt)))
    .limit(1);
  if (!current) throw new UserFacingError(NOT_FOUND);

  await assertDivisionFits(db, data, current.divisionId);
  await assertUsableMedia(db, [
    { id: data.bodyMediaId, kind: "fighter_body" },
    { id: data.headshotMediaId, kind: "fighter_headshot" },
  ]);

  const slug = data.slug ?? current.slug;
  if (slug !== current.slug && (await slugTaken(db, slug, id))) {
    throw new UserFacingError("Ese enlace ya lo usa otro peleador");
  }

  await db
    .update(fighters)
    .set({
      ...editableColumns(data),
      slug,
      ...(data.status ? { status: data.status, publishAt: normalizePublishAt({ status: data.status, publishAt: data.publishAt }) } : {}),
    })
    .where(eq(fighters.id, id));

  await logAudit(db, {
    actorId,
    action: "update",
    entityType: "fighter",
    entityId: id,
    summary: `Editó al peleador ${fullName(data)}`,
  });
  return { slug };
}

const PUBLICATION_LABEL = { draft: "Pasó a borrador a", scheduled: "Programó la publicación de", published: "Publicó a" } as const;

export async function setFighterPublication(db: Db, id: string, input: PublicationInput, actorId: string): Promise<void> {
  const parsed = publicationInputSchema.safeParse(input);
  if (!parsed.success) throw new UserFacingError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { status, publishAt } = parsed.data;

  const [updated] = await db
    .update(fighters)
    .set({ status, publishAt: normalizePublishAt({ status, publishAt }) })
    .where(and(eq(fighters.id, id), isNull(fighters.deletedAt)))
    .returning({ firstName: fighters.firstName, lastName: fighters.lastName });
  if (!updated) throw new UserFacingError(NOT_FOUND);

  await logAudit(db, {
    actorId,
    action: "publish",
    entityType: "fighter",
    entityId: id,
    summary: `${PUBLICATION_LABEL[status]} ${fullName(updated)}`,
  });
}

/** Envía al peleador a la papelera (se recupera desde Papelera; se elimina solo a los 30 días). */
export async function deleteFighter(db: Db, id: string, actorId: string): Promise<void> {
  try {
    await softDelete(db, "fighter", id, actorId);
  } catch {
    throw new UserFacingError(NOT_FOUND);
  }
}
