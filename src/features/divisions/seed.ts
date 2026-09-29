import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { divisionSlug } from "./slug";

type SeedDivision = { name: string; gender: "male" | "female"; limitKg: number };

const MALE: [string, number][] = [
  ["Mosca", 56.7],
  ["Gallo", 61.2],
  ["Pluma", 65.8],
  ["Ligero", 70.3],
  ["Wélter", 77.1],
  ["Medio", 83.9],
  ["Semipesado", 93.0],
  ["Pesado", 120.2],
];

const FEMALE: [string, number][] = [
  ["Paja", 52.2],
  ["Mosca", 56.7],
  ["Gallo", 61.2],
  ["Pluma", 65.8],
];

const SEED_DIVISIONS: SeedDivision[] = [
  ...MALE.map(([name, limitKg]) => ({ name, gender: "male" as const, limitKg })),
  ...FEMALE.map(([name, limitKg]) => ({ name, gender: "female" as const, limitKg })),
];

export async function seedDivisions(db: Db): Promise<void> {
  const counters = { male: 0, female: 0 };
  await db
    .insert(divisions)
    .values(
      SEED_DIVISIONS.map((division) => ({
        ...division,
        slug: divisionSlug(division.name, division.gender),
        sortOrder: (counters[division.gender] += 1),
      })),
    )
    .onConflictDoNothing({ target: divisions.slug });
}
