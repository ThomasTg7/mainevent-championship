import { and, asc, desc, eq, isNull, like, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { publicScope } from "@/db/public-scope";
import { divisions } from "@/db/schema/divisions";
import { fighters, type Fighter } from "@/db/schema/fighters";
import { normalizeSearchText } from "@/domain/search";
import type { MediaDTO } from "@/features/media/dto";
import { getMediaByIds } from "@/features/media/queries";
import type { AdminFighterRow, FighterCardDTO, FighterProfileDTO, ManualRecord } from "./dto";
import type { FighterFilters } from "./schema";

const PUBLIC_PAGE_SIZE = 24;
const ADMIN_PAGE_SIZE = 50;

type PageOptions = { page?: number; pageSize?: number };
type PreviewOptions = { preview?: boolean };
export type AdminFighterFilters = FighterFilters & { publication?: "draft" | "scheduled" | "published" };

const cardColumns = {
  id: fighters.id,
  slug: fighters.slug,
  firstName: fighters.firstName,
  lastName: fighters.lastName,
  nickname: fighters.nickname,
  gender: fighters.gender,
  nationality: fighters.nationality,
  careerStatus: fighters.careerStatus,
  proWins: fighters.proWins,
  proLosses: fighters.proLosses,
  proDraws: fighters.proDraws,
  proNoContests: fighters.proNoContests,
  bodyMediaId: fighters.bodyMediaId,
  divisionName: divisions.name,
  divisionSlug: divisions.slug,
  divisionLimitKg: divisions.limitKg,
  divisionGender: divisions.gender,
};

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** Cada palabra de la búsqueda debe aparecer (sin tildes ni mayúsculas) en nombre, apellido o apodo. */
function filterConditions(filters: FighterFilters): SQL[] {
  const conditions: SQL[] = [];
  for (const word of normalizeSearchText(filters.q ?? "").split(" ").filter(Boolean)) {
    conditions.push(like(fighters.searchText, `%${escapeLike(word)}%`));
  }
  if (filters.division) conditions.push(eq(divisions.slug, filters.division));
  if (filters.nationality) conditions.push(eq(fighters.nationality, filters.nationality.toUpperCase()));
  if (filters.gender) conditions.push(eq(fighters.gender, filters.gender));
  if (filters.status) conditions.push(eq(fighters.careerStatus, filters.status));
  return conditions;
}

function pageWindow({ page = 1, pageSize }: PageOptions, fallbackSize: number) {
  const size = pageSize ?? fallbackSize;
  return { limit: size + 1, offset: (Math.max(page, 1) - 1) * size, size };
}

async function loadMedia(db: Db, ids: (string | null)[]): Promise<Map<string, MediaDTO>> {
  return getMediaByIds(db, [...new Set(ids.filter((id): id is string => id !== null))]);
}

function manualRecord(wins: number, losses: number, draws: number, noContests: number): ManualRecord {
  return { wins, losses, draws, noContests };
}

type CardRow = Pick<Fighter, "id" | "slug" | "firstName" | "lastName" | "nickname" | "gender" | "nationality" | "careerStatus" | "proWins" | "proLosses" | "proDraws" | "proNoContests" | "bodyMediaId"> & {
  divisionName: string;
  divisionSlug: string;
  divisionLimitKg: number;
  divisionGender: "male" | "female";
};

function toCard(row: CardRow, mediaById: Map<string, MediaDTO>): FighterCardDTO {
  return {
    id: row.id,
    slug: row.slug,
    firstName: row.firstName,
    lastName: row.lastName,
    nickname: row.nickname,
    gender: row.gender,
    nationality: row.nationality,
    careerStatus: row.careerStatus,
    division: { name: row.divisionName, slug: row.divisionSlug, limitKg: row.divisionLimitKg, gender: row.divisionGender },
    record: manualRecord(row.proWins, row.proLosses, row.proDraws, row.proNoContests),
    bodyMedia: row.bodyMediaId ? (mediaById.get(row.bodyMediaId) ?? null) : null,
  };
}

/** Listado público (solo publicados). Con `preview` incluye borradores; nunca lo que está en la papelera. */
export async function listPublicFighters(
  db: Db,
  filters: FighterFilters,
  options: PageOptions & PreviewOptions = {},
): Promise<{ items: FighterCardDTO[]; hasMore: boolean }> {
  const { limit, offset, size } = pageWindow(options, PUBLIC_PAGE_SIZE);
  const rows = await db
    .select(cardColumns)
    .from(fighters)
    .innerJoin(divisions, eq(fighters.divisionId, divisions.id))
    .where(and(options.preview ? isNull(fighters.deletedAt) : publicScope(fighters), ...filterConditions(filters)))
    .orderBy(asc(fighters.lastName), asc(fighters.firstName), asc(fighters.id))
    .limit(limit)
    .offset(offset);

  const page = rows.slice(0, size);
  const mediaById = await loadMedia(db, page.map((row) => row.bodyMediaId));
  return { items: page.map((row) => toCard(row, mediaById)), hasMore: rows.length > size };
}

export async function getPublicFighterBySlug(
  db: Db,
  slug: string,
  { preview = false }: PreviewOptions = {},
): Promise<FighterProfileDTO | null> {
  const [row] = await db
    .select({
      ...cardColumns,
      birthDate: fighters.birthDate,
      hometown: fighters.hometown,
      weightKg: fighters.weightKg,
      heightCm: fighters.heightCm,
      reachCm: fighters.reachCm,
      stance: fighters.stance,
      gym: fighters.gym,
      coach: fighters.coach,
      baseDiscipline: fighters.baseDiscipline,
      bio: fighters.bio,
      socials: fighters.socials,
      amWins: fighters.amWins,
      amLosses: fighters.amLosses,
      amDraws: fighters.amDraws,
      amNoContests: fighters.amNoContests,
      headshotMediaId: fighters.headshotMediaId,
    })
    .from(fighters)
    .innerJoin(divisions, eq(fighters.divisionId, divisions.id))
    .where(and(eq(fighters.slug, slug), preview ? isNull(fighters.deletedAt) : publicScope(fighters)))
    .limit(1);
  if (!row) return null;

  const mediaById = await loadMedia(db, [row.bodyMediaId, row.headshotMediaId]);
  const card = toCard(row, mediaById);
  return {
    ...card,
    birthDate: row.birthDate,
    hometown: row.hometown,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    reachCm: row.reachCm,
    stance: row.stance,
    gym: row.gym,
    coach: row.coach,
    baseDiscipline: row.baseDiscipline,
    bio: row.bio,
    socials: row.socials,
    proRecord: card.record,
    amateurRecord: manualRecord(row.amWins, row.amLosses, row.amDraws, row.amNoContests),
    headshotMedia: row.headshotMediaId ? (mediaById.get(row.headshotMediaId) ?? null) : null,
  };
}

/** Listado del panel: incluye borradores y programados, no la papelera. Más recientes primero. */
export async function listAdminFighters(
  db: Db,
  filters: AdminFighterFilters,
  options: PageOptions = {},
): Promise<{ items: AdminFighterRow[]; hasMore: boolean }> {
  const { limit, offset, size } = pageWindow(options, ADMIN_PAGE_SIZE);
  const conditions = [isNull(fighters.deletedAt), ...filterConditions(filters)];
  if (filters.publication) conditions.push(eq(fighters.status, filters.publication));

  const rows = await db
    .select({
      id: fighters.id,
      slug: fighters.slug,
      firstName: fighters.firstName,
      lastName: fighters.lastName,
      nickname: fighters.nickname,
      nationality: fighters.nationality,
      careerStatus: fighters.careerStatus,
      status: fighters.status,
      publishAt: fighters.publishAt,
      updatedAt: fighters.updatedAt,
      bodyMediaId: fighters.bodyMediaId,
      divisionName: divisions.name,
    })
    .from(fighters)
    .innerJoin(divisions, eq(fighters.divisionId, divisions.id))
    .where(and(...conditions))
    .orderBy(desc(fighters.updatedAt), asc(fighters.id))
    .limit(limit)
    .offset(offset);

  const page = rows.slice(0, size);
  const mediaById = await loadMedia(db, page.map((row) => row.bodyMediaId));
  return {
    items: page.map(({ bodyMediaId, ...row }) => ({ ...row, bodyMedia: bodyMediaId ? (mediaById.get(bodyMediaId) ?? null) : null })),
    hasMore: rows.length > size,
  };
}

/** Datos crudos y las dos fotos para el formulario de edición (una sola lectura de imágenes). */
export async function getFighterForEdit(
  db: Db,
  id: string,
): Promise<{ fighter: Fighter; bodyMedia: MediaDTO | null; headshotMedia: MediaDTO | null } | null> {
  const [fighter] = await db
    .select()
    .from(fighters)
    .where(and(eq(fighters.id, id), isNull(fighters.deletedAt)))
    .limit(1);
  if (!fighter) return null;

  const mediaById = await loadMedia(db, [fighter.bodyMediaId, fighter.headshotMediaId]);
  return {
    fighter,
    bodyMedia: fighter.bodyMediaId ? (mediaById.get(fighter.bodyMediaId) ?? null) : null,
    headshotMedia: fighter.headshotMediaId ? (mediaById.get(fighter.headshotMediaId) ?? null) : null,
  };
}

export type PublicFilterOptions = {
  divisions: { slug: string; name: string; gender: "male" | "female"; limitKg: number }[];
  /** Códigos ISO de los países que tienen peleadores publicados. */
  nationalities: string[];
};

/** Opciones de los filtros públicos: solo lo que tiene resultados, para no ofrecer filtros que dan una lista vacía. */
export async function listPublicFilterOptions(db: Db): Promise<PublicFilterOptions> {
  const [divisionRows, nationalityRows] = await Promise.all([
    db
      .selectDistinct({ slug: divisions.slug, name: divisions.name, gender: divisions.gender, limitKg: divisions.limitKg, sortOrder: divisions.sortOrder })
      .from(fighters)
      .innerJoin(divisions, eq(fighters.divisionId, divisions.id))
      .where(publicScope(fighters))
      .orderBy(asc(divisions.gender), asc(divisions.sortOrder)),
    db.selectDistinct({ nationality: fighters.nationality }).from(fighters).where(publicScope(fighters)).orderBy(asc(fighters.nationality)),
  ]);
  return {
    divisions: divisionRows.map(({ sortOrder: _sortOrder, ...division }) => division),
    nationalities: nationalityRows.map((row) => row.nationality),
  };
}

/** Lectura mínima (una fila por índice único) para saber si la ficha es pública y qué etiquetas de caché lleva. */
export async function getPublicFighterRef(
  db: Db,
  slug: string,
): Promise<{ id: string; bodyMediaId: string | null; headshotMediaId: string | null } | null> {
  const [row] = await db
    .select({ id: fighters.id, bodyMediaId: fighters.bodyMediaId, headshotMediaId: fighters.headshotMediaId })
    .from(fighters)
    .where(and(eq(fighters.slug, slug), publicScope(fighters)))
    .limit(1);
  return row ?? null;
}
