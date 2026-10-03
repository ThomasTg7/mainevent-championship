import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { fighters } from "@/db/schema/fighters";
import { rankingLevels, rankingVersions, titles } from "@/db/schema/rankings";
import type { BoutLevel } from "@/domain/bout-enums";
import { seedEvents } from "@/features/events/seed";
import { saveRanking, setChampion } from "./service";

const ACTOR = "seed";

type SeedScope = { level: BoutLevel; division: string | null; champion?: string; ranking: string[] };

// Pro: un campeón y dos o tres puestos por división (los retirados no entran) y un libra por libra. Amateur: solo Paja
// femenino, la única división con peleas amateur en el seed. Todo pasa por los servicios: el seed respeta las mismas reglas.
const SEED_SCOPES: SeedScope[] = [
  { level: "pro", division: "peso-ligero", champion: "matias-perez", ranking: ["diego-soto", "felipe-araya"] },
  { level: "pro", division: "peso-welter", champion: "bruno-andrade", ranking: ["ignacio-fuentes", "joaquin-nunez"] },
  { level: "pro", division: "peso-paja-femenino", champion: "camila-rojas", ranking: ["valentina-cortes", "javiera-munoz"] },
  { level: "pro", division: "peso-pluma", champion: "martin-olivares", ranking: ["sebastian-lagos"] },
  { level: "pro", division: null, ranking: ["matias-perez", "camila-rojas", "diego-soto", "bruno-andrade", "valentina-cortes"] },
  { level: "amateur", division: "peso-paja-femenino", champion: "valentina-cortes", ranking: ["javiera-munoz"] },
];

/** Campeones y rankings del seed (los de GC 1–4). No hace nada si ya hay títulos o rankings: no pisa lo que cargó la promotora. */
export async function seedRankings(db: Db): Promise<void> {
  await seedEvents(db);
  // El seed muestra los dos niveles (una instalación nueva los tiene ocultos hasta que la promotora los muestre).
  await db.insert(rankingLevels).values([{ level: "pro", isPublic: true }, { level: "amateur", isPublic: true }]).onConflictDoNothing();
  const [existingTitle] = await db.select({ id: titles.id }).from(titles).limit(1);
  const [existingVersion] = await db.select({ id: rankingVersions.id }).from(rankingVersions).limit(1);
  if (existingTitle || existingVersion) return;

  const [divisionRows, fighterRows] = await Promise.all([
    db.select({ id: divisions.id, slug: divisions.slug }).from(divisions),
    db.select({ id: fighters.id, slug: fighters.slug }).from(fighters).where(eq(fighters.status, "published")),
  ]);
  const divisionId = new Map(divisionRows.map((row) => [row.slug, row.id]));
  const fighterId = new Map(fighterRows.map((row) => [row.slug, row.id]));
  const idOf = (map: Map<string, string>, slug: string, what: string) => {
    const id = map.get(slug);
    if (!id) throw new Error(`Falta ${what} «${slug}» para el seed de rankings`);
    return id;
  };

  for (const scope of SEED_SCOPES) {
    const division = scope.division ? idOf(divisionId, scope.division, "la división") : null;
    if (division && scope.champion) await setChampion(db, scope.level, division, idOf(fighterId, scope.champion, "el peleador"), ACTOR);
    await saveRanking(db, { level: scope.level, divisionId: division }, scope.ranking.map((slug) => idOf(fighterId, slug, "el peleador")), ACTOR);
  }
}
