import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { fighters } from "@/db/schema/fighters";
import { normalizeSearchText } from "@/domain/search";
import { slugify } from "@/domain/slug";
import { seedDivisions } from "@/features/divisions/seed";

type SeedFighter = {
  firstName: string;
  lastName: string;
  nickname: string;
  nationality: string;
  divisionSlug: string;
  record: [wins: number, losses: number, draws: number];
  careerStatus?: "active" | "retired";
  hometown: string;
  gym: string;
  heightCm: number;
  /** Alcance (cm): lo traen solo algunos, para que la comparación de la cartelera omita el dato cuando falta. */
  reachCm?: number;
  stance: "orthodox" | "southpaw";
  bio: string;
  birthDate: string;
};

const SEED_FIGHTERS: SeedFighter[] = [
  { firstName: "Matías", lastName: "Pérez", nickname: "El Toro", nationality: "CL", divisionSlug: "peso-ligero", record: [12, 2, 0], hometown: "Rancagua", gym: "Team Toro", heightCm: 180, reachCm: 184, stance: "orthodox", bio: "Campeón peso ligero. Lucha aplastante y pegada de nocaut.", birthDate: "1994-03-12" },
  { firstName: "Diego", lastName: "Soto", nickname: "La Sombra", nationality: "AR", divisionSlug: "peso-ligero", record: [10, 1, 0], hometown: "Mendoza", gym: "Andes MMA", heightCm: 178, reachCm: 181, stance: "southpaw", bio: "Zurdo veloz, especialista en contragolpes.", birthDate: "1996-07-21" },
  { firstName: "Felipe", lastName: "Araya", nickname: "Relámpago", nationality: "CL", divisionSlug: "peso-ligero", record: [7, 3, 0], hometown: "Antofagasta", gym: "Norte Fight", heightCm: 176, stance: "orthodox", bio: "Ritmo alto y cardio de sobra.", birthDate: "1998-11-02" },
  { firstName: "Ignacio", lastName: "Fuentes", nickname: "Martillo", nationality: "CL", divisionSlug: "peso-welter", record: [9, 3, 1], hometown: "Temuco", gym: "Sur Combat", heightCm: 183, stance: "orthodox", bio: "Golpeador de mano pesada.", birthDate: "1993-05-30" },
  { firstName: "Bruno", lastName: "Andrade", nickname: "Pitbull", nationality: "BR", divisionSlug: "peso-welter", record: [8, 2, 0], hometown: "São Paulo", gym: "Brava BJJ", heightCm: 181, stance: "southpaw", bio: "Cinturón negro de jiu-jitsu, no suelta la presa.", birthDate: "1995-09-14" },
  { firstName: "Joaquín", lastName: "Núñez", nickname: "El Muro", nationality: "CL", divisionSlug: "peso-welter", record: [6, 4, 0], hometown: "Valdivia", gym: "Sur Combat", heightCm: 185, stance: "orthodox", bio: "Defensa sólida y lucha libre.", birthDate: "1997-01-08" },
  { firstName: "Camila", lastName: "Rojas", nickname: "La Leona", nationality: "CL", divisionSlug: "peso-paja-femenino", record: [7, 1, 0], hometown: "Santiago", gym: "Leonas MMA", heightCm: 162, stance: "orthodox", bio: "Campeona peso paja. Combina boxeo y derribos.", birthDate: "2000-02-29" },
  { firstName: "Valentina", lastName: "Cortés", nickname: "Tormenta", nationality: "CL", divisionSlug: "peso-paja-femenino", record: [5, 2, 1], hometown: "Viña del Mar", gym: "Costa Fight", heightCm: 160, stance: "southpaw", bio: "Presión constante y patadas al cuerpo.", birthDate: "2000-04-18" },
  { firstName: "Javiera", lastName: "Muñoz", nickname: "Bala", nationality: "PE", divisionSlug: "peso-paja-femenino", record: [4, 3, 0], hometown: "Lima", gym: "Inka Combat", heightCm: 158, stance: "orthodox", bio: "Explosiva en los primeros rounds.", birthDate: "2001-10-05" },
  { firstName: "Sebastián", lastName: "Lagos", nickname: "Halcón", nationality: "CL", divisionSlug: "peso-pluma", record: [11, 2, 0], hometown: "Concepción", gym: "Bío Bío MMA", heightCm: 172, stance: "orthodox", bio: "Cazador de sumisiones desde el suelo.", birthDate: "1992-12-25" },
  { firstName: "Martín", lastName: "Olivares", nickname: "Ciclón", nationality: "UY", divisionSlug: "peso-pluma", record: [9, 4, 0], hometown: "Montevideo", gym: "Río de la Plata Fight", heightCm: 170, stance: "southpaw", bio: "Movimiento constante y golpes en combinación.", birthDate: "1994-08-09" },
  { firstName: "Nicolás", lastName: "Ibarra", nickname: "El Profe", nationality: "CL", divisionSlug: "peso-pluma", record: [14, 6, 1], careerStatus: "retired", hometown: "Talca", gym: "Maule Fight", heightCm: 171, stance: "orthodox", bio: "Veterano retirado; hoy entrena a nuevas generaciones.", birthDate: "1988-06-16" },
];

/** 12 peleadores ficticios publicados, repartidos en Ligero, Wélter, Paja femenino y Pluma. Idempotente. */
export async function seedFighters(db: Db): Promise<void> {
  await seedDivisions(db);
  const divisionRows = await db.select({ id: divisions.id, slug: divisions.slug, gender: divisions.gender, limitKg: divisions.limitKg }).from(divisions);
  const divisionBySlug = new Map(divisionRows.map((division) => [division.slug, division]));

  await db
    .insert(fighters)
    .values(
      SEED_FIGHTERS.map((fighter) => {
        const division = divisionBySlug.get(fighter.divisionSlug);
        if (!division) throw new Error(`Falta la división ${fighter.divisionSlug}`);
        const [wins, losses, draws] = fighter.record;
        return {
          slug: slugify(`${fighter.firstName} ${fighter.lastName}`),
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
          reachCm: fighter.reachCm ?? null,
          stance: fighter.stance,
          bio: fighter.bio,
          careerStatus: fighter.careerStatus ?? "active",
          proWins: wins,
          proLosses: losses,
          proDraws: draws,
          searchText: normalizeSearchText(`${fighter.firstName} ${fighter.lastName} ${fighter.nickname}`),
          status: "published" as const,
        };
      }),
    )
    .onConflictDoNothing({ target: fighters.slug });
}
